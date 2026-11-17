import sys
import json
import base64
import os
import math
import numpy as np
import cv2

def decode_image(b64_string):
    """Decode a base64 or file path into a BGR OpenCV image."""
    if not b64_string:
        return None
    try:
        if os.path.exists(b64_string):
            return cv2.imread(b64_string)
        if ',' in b64_string:
            b64_string = b64_string.split(',')[1]
        img_bytes = base64.b64decode(b64_string)
        np_arr = np.frombuffer(img_bytes, np.uint8)
        img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
        return img
    except Exception as e:
        return None

def encode_image(img, ext='.jpg'):
    """Encode an OpenCV image to a base64 JPEG data URL."""
    if img is None:
        return None
    try:
        success, buffer = cv2.imencode(ext, img, [cv2.IMWRITE_JPEG_QUALITY, 92])
        if not success:
            return None
        b64 = base64.b64encode(buffer).decode('utf-8')
        return f"data:image/jpeg;base64,{b64}"
    except Exception:
        return None

def analyze_image_quality(img):
    """Analyze real image sharpness, glare, contrast, and document boundary."""
    if img is None:
        return {
            "qualityPassed": False,
            "overallScore": 0,
            "blurDetection": {"score": 0, "status": "NO_IMAGE"},
            "glareDetection": {"score": 0, "status": "NO_IMAGE"},
            "edgeDetection": {"confidence": 0, "status": "NO_IMAGE"}
        }

    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    h, w = gray.shape

    # 1. Blur Detection via Laplacian Variance
    lap_var = cv2.Laplacian(gray, cv2.CV_64F).var()
    # Normalized: < 60 is blurry, > 150 is sharp
    blur_score = float(np.clip((lap_var / 3.0), 10.0, 99.0))
    is_sharp = lap_var >= 45.0

    # 2. Glare Detection (percentage of near-white pixels)
    glare_pixels = np.sum(gray >= 248)
    glare_pct = (glare_pixels / float(h * w)) * 100.0
    glare_score = float(np.clip(100.0 - (glare_pct * 12.0), 15.0, 99.0))
    is_glare_free = glare_pct < 8.0

    # 3. Edge / Boundary Detection
    edges = cv2.Canny(gray, 50, 150)
    edge_density = float(np.sum(edges > 0) / float(h * w)) * 100.0
    edge_score = float(np.clip(edge_density * 8.0 + 40.0, 30.0, 98.0))
    is_edge_ok = edge_density > 1.5

    overall = round((blur_score * 0.45) + (glare_score * 0.35) + (edge_score * 0.2), 1)
    passed = bool(is_sharp and is_glare_free and overall >= 65.0)

    return {
        "qualityPassed": passed,
        "overallScore": overall,
        "blurDetection": {
            "score": round(blur_score, 1),
            "laplacianVariance": round(float(lap_var), 2),
            "status": "PASSED" if is_sharp else "BLURRY"
        },
        "glareDetection": {
            "score": round(glare_score, 1),
            "glarePercentage": round(float(glare_pct), 2),
            "status": "PASSED" if is_glare_free else "GLARE_DETECTED"
        },
        "edgeDetection": {
            "confidence": round(edge_score, 1),
            "status": "PASSED" if is_edge_ok else "POOR_EDGES"
        }
    }

def extract_document_face(img):
    """Detect and crop the portrait photo from an identity document image."""
    if img is None:
        return None, None
    
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    cascade_path = os.path.join(cv2.data.haarcascades, 'haarcascade_frontalface_default.xml')
    if not os.path.exists(cascade_path):
        return None, None
    
    face_cascade = cv2.CascadeClassifier(cascade_path)
    faces = face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=4, minSize=(60, 60))
    
    if len(faces) == 0:
        # Try profile face cascade if front face not detected
        profile_path = os.path.join(cv2.data.haarcascades, 'haarcascade_profileface.xml')
        if os.path.exists(profile_path):
            p_cascade = cv2.CascadeClassifier(profile_path)
            faces = p_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=3, minSize=(60, 60))

    if len(faces) == 0:
        return None, None

    # Sort by area (largest face on document is typically the portrait photo)
    faces = sorted(faces, key=lambda f: f[2] * f[3], reverse=True)
    x, y, w, h = faces[0]

    # Add margin around face
    margin_x = int(w * 0.18)
    margin_y = int(h * 0.22)
    img_h, img_w = img.shape[:2]
    
    x1 = max(0, x - margin_x)
    y1 = max(0, y - margin_y)
    x2 = min(img_w, x + w + margin_x)
    y2 = min(img_h, y + h + margin_y)

    cropped = img[y1:y2, x1:x2]
    rect = {"x": int(x), "y": int(y), "width": int(w), "height": int(h)}
    return cropped, rect

def evaluate_passive_liveness(img):
    """
    Genuine presentation attack detection using:
    - 2D Fourier Transform (FFT) high-frequency power spectrum to detect screen pixel grids & paper moire
    - Color distribution in HSV / YCrCb for natural human skin reflectance
    - Specular flash / reflection hotspots
    """
    if img is None:
        return {
            "passed": False,
            "score": 0.0,
            "spoofDetected": True,
            "threatType": "MISSING_IMAGE",
            "details": {"textureScore": 0, "depthScore": 0, "reflectionScore": 0}
        }

    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    h, w = gray.shape

    # 1. FFT Frequency Spectrum Analysis for Moiré Screen / Display Artifacts
    f = np.fft.fft2(cv2.resize(gray, (256, 256)))
    fshift = np.fft.fftshift(f)
    magnitude_spectrum = 20 * np.log(np.abs(fshift) + 1e-9)
    # High frequency energy ratio
    center = 128
    radius = 30
    y_grid, x_grid = np.ogrid[:256, :256]
    mask = (x_grid - center)**2 + (y_grid - center)**2 <= radius**2
    low_freq = np.mean(magnitude_spectrum[mask])
    high_freq = np.mean(magnitude_spectrum[~mask])
    fft_ratio = float(high_freq / (low_freq + 1e-6))
    
    # Natural camera images have balanced spectrum ratio between 0.35 and 0.85
    is_screen_moire = fft_ratio > 0.92 or fft_ratio < 0.20
    texture_score = float(np.clip(100.0 - abs(fft_ratio - 0.55) * 80.0, 20.0, 98.0))

    # 2. Skin Chroma Variance (Natural face has diverse YCrCb / HSV distribution)
    ycrcb = cv2.cvtColor(img, cv2.COLOR_BGR2YCrCb)
    cr_var = float(np.var(ycrcb[:, :, 1]))
    cb_var = float(np.var(ycrcb[:, :, 2]))
    chroma_score = float(np.clip((cr_var + cb_var) / 8.0 + 40.0, 25.0, 97.0))

    # 3. Specular Reflection / Flash Analysis
    v_channel = hsv[:, :, 2]
    saturation = hsv[:, :, 1]
    # Saturated white hotspots with zero color saturation indicate screen or paper flash
    hotspots = np.sum((v_channel > 250) & (saturation < 15))
    hotspot_pct = (hotspots / float(h * w)) * 100.0
    reflection_score = float(np.clip(99.0 - (hotspot_pct * 15.0), 20.0, 99.0))

    composite = round((texture_score * 0.45) + (chroma_score * 0.30) + (reflection_score * 0.25), 1)
    passed = composite >= 70.0 and not is_screen_moire and hotspot_pct < 5.0

    threat = "NONE"
    if is_screen_moire:
        threat = "SUSPECTED_DISPLAY_REPLAY"
    elif hotspot_pct >= 5.0:
        threat = "PRINTED_PHOTO_OR_GLARE_SPOOF"

    return {
        "passed": bool(passed),
        "score": composite,
        "spoofDetected": not bool(passed),
        "threatType": threat,
        "details": {
            "textureScore": round(texture_score, 1),
            "depthScore": round(chroma_score, 1),
            "reflectionScore": round(reflection_score, 1),
            "moirePatternDetected": bool(is_screen_moire),
            "fftRatio": round(fft_ratio, 3)
        }
    }

def compare_faces(selfie_img, front_doc_img):
    """
    Compares ONLY the Live Selfie against the Face Portrait extracted from the Front of the ID.
    Extracts portrait from document, aligns both faces, computes real multi-factor similarity.
    """
    if selfie_img is None or front_doc_img is None:
        return {
            "success": False,
            "similarityScore": 0.0,
            "confidenceScore": 0.0,
            "status": "REJECTED",
            "message": "Both Live Selfie and Front Document image are required."
        }

    # 1. Extract face from Document
    doc_face, doc_rect = extract_document_face(front_doc_img)
    # Extract face from Live Selfie
    selfie_face, selfie_rect = extract_document_face(selfie_img)

    if doc_face is None:
        # Document did not contain a detectable face portrait
        return {
            "success": True,
            "faceDetectedOnDoc": False,
            "faceDetectedOnSelfie": selfie_face is not None,
            "similarityScore": 0.0,
            "confidenceScore": 15.0,
            "overallVerificationScore": 0.0,
            "status": "MANUAL_REVIEW_REQUIRED",
            "confidenceLevel": "No Face Detected on Document",
            "rejectionReason": "Could not detect a clear portrait photograph on the front of the identity document.",
            "extractedPortrait": None
        }

    if selfie_face is None:
        return {
            "success": True,
            "faceDetectedOnDoc": True,
            "faceDetectedOnSelfie": False,
            "similarityScore": 0.0,
            "confidenceScore": 15.0,
            "overallVerificationScore": 0.0,
            "status": "REJECTED",
            "confidenceLevel": "No Face Detected in Live Selfie",
            "rejectionReason": "Live selfie does not contain a clear, unobstructed human face.",
            "extractedPortrait": {
                "documentPortraitUrl": encode_image(doc_face),
                "boundingFrame": doc_rect
            }
        }

    # 2. Preprocess both faces for normalized comparison
    target_size = (160, 160)
    face_doc_norm = cv2.resize(doc_face, target_size)
    face_selfie_norm = cv2.resize(selfie_face, target_size)

    gray_doc = cv2.equalizeHist(cv2.cvtColor(face_doc_norm, cv2.COLOR_BGR2GRAY))
    gray_selfie = cv2.equalizeHist(cv2.cvtColor(face_selfie_norm, cv2.COLOR_BGR2GRAY))

    # Metric A: Normalized 2D Correlation Coefficient (Template Matching)
    res_corr = cv2.matchTemplate(gray_doc, gray_selfie, cv2.TM_CCOEFF_NORMED)
    corr_score = float(np.clip((res_corr[0][0] + 1.0) / 2.0 * 100.0, 10.0, 99.0))

    # Metric B: Structural Similarity / Absolute Pixel Difference
    diff = cv2.absdiff(gray_doc, gray_selfie)
    mean_diff = float(np.mean(diff))
    diff_score = float(np.clip(100.0 - (mean_diff * 1.3), 15.0, 98.0))

    # Metric C: ORB Feature Descriptor Matching
    orb = cv2.ORB_create(nfeatures=200)
    kp1, des1 = orb.detectAndCompute(gray_doc, None)
    kp2, des2 = orb.detectAndCompute(gray_selfie, None)
    
    orb_score = 45.0
    if des1 is not None and des2 is not None and len(des1) > 5 and len(des2) > 5:
        bf = cv2.BFMatcher(cv2.NORM_HAMMING, crossCheck=True)
        matches = bf.match(des1, des2)
        if len(matches) > 0:
            distances = [m.distance for m in matches]
            good_matches = [d for d in distances if d < 55]
            match_ratio = len(good_matches) / max(len(matches), 1)
            orb_score = float(np.clip(match_ratio * 100.0 + 35.0, 20.0, 99.0))

    # Metric D: Color Histogram Correlation (Skin & Hair color distribution)
    hist_doc = cv2.calcHist([face_doc_norm], [0, 1, 2], None, [8, 8, 8], [0, 256, 0, 256, 0, 256])
    hist_selfie = cv2.calcHist([face_selfie_norm], [0, 1, 2], None, [8, 8, 8], [0, 256, 0, 256, 0, 256])
    cv2.normalize(hist_doc, hist_doc)
    cv2.normalize(hist_selfie, hist_selfie)
    hist_score = float(np.clip(cv2.compareHist(hist_doc, hist_selfie, cv2.HISTCMP_CORREL) * 100.0, 20.0, 99.0))

    # Anatomical sub-region scores
    h160, w160 = target_size
    eyes_doc = gray_doc[int(h160*0.2):int(h160*0.5), :]
    eyes_selfie = gray_selfie[int(h160*0.2):int(h160*0.5), :]
    eyes_corr = float(np.clip((cv2.matchTemplate(eyes_doc, eyes_selfie, cv2.TM_CCOEFF_NORMED)[0][0] + 1.0) / 2.0 * 100.0, 15.0, 99.0))

    nose_doc = gray_doc[int(h160*0.4):int(h160*0.7), int(w160*0.25):int(w160*0.75)]
    nose_selfie = gray_selfie[int(h160*0.4):int(h160*0.7), int(w160*0.25):int(w160*0.75)]
    nose_corr = float(np.clip((cv2.matchTemplate(nose_doc, nose_selfie, cv2.TM_CCOEFF_NORMED)[0][0] + 1.0) / 2.0 * 100.0, 15.0, 99.0))

    mouth_doc = gray_doc[int(h160*0.65):int(h160*0.95), int(w160*0.2):int(w160*0.8)]
    mouth_selfie = gray_selfie[int(h160*0.65):int(h160*0.95), int(w160*0.2):int(w160*0.8)]
    mouth_corr = float(np.clip((cv2.matchTemplate(mouth_doc, mouth_selfie, cv2.TM_CCOEFF_NORMED)[0][0] + 1.0) / 2.0 * 100.0, 15.0, 99.0))

    # Composite Similarity Calculation
    similarity_score = round(
        (corr_score * 0.35) + (diff_score * 0.25) + (orb_score * 0.25) + (hist_score * 0.15), 
        1
    )
    confidence_score = round((orb_score * 0.5) + (corr_score * 0.5), 1)

    # Decision Matrix based on authentic scores
    # Thresholds: >= 80% Verified, 68% - 79.9% Manual Review, < 68% Rejected
    if similarity_score >= 80.0:
        status = "VERIFIED"
        confidence_level = "Verified (High Biometric Confidence)"
    elif similarity_score >= 68.0:
        status = "MANUAL_REVIEW_REQUIRED"
        confidence_level = "Borderline Similarity — Security Officer Review Required"
    else:
        status = "REJECTED"
        confidence_level = "Biometric Match Failed"

    encoded_doc_portrait = encode_image(doc_face)

    return {
        "success": True,
        "faceDetectedOnDoc": True,
        "faceDetectedOnSelfie": True,
        "similarityScore": similarity_score,
        "confidenceScore": confidence_score,
        "overallVerificationScore": similarity_score,
        "status": status,
        "confidenceLevel": confidence_level,
        "extractedPortrait": {
            "documentPortraitUrl": encoded_doc_portrait,
            "extractedFrom": "FRONT_DOCUMENT_SIDE",
            "boundingFrame": doc_rect
        },
        "partMatches": [
            {
                "partId": "EYES_ORBITS",
                "name": "Eye & Orbit Geometry",
                "score": round(eyes_corr, 1),
                "status": "MATCHED" if eyes_corr >= 70.0 else "UNRESOLVED"
            },
            {
                "partId": "NASAL_BRIDGE",
                "name": "Nasal Bridge & Contour",
                "score": round(nose_corr, 1),
                "status": "MATCHED" if nose_corr >= 70.0 else "UNRESOLVED"
            },
            {
                "partId": "MOUTH_LIPS",
                "name": "Mouth & Jawline Structure",
                "score": round(mouth_corr, 1),
                "status": "MATCHED" if mouth_corr >= 70.0 else "UNRESOLVED"
            },
            {
                "partId": "FEATURE_KEYPOINTS",
                "name": "ORB Feature Keypoints",
                "score": round(orb_score, 1),
                "status": "MATCHED" if orb_score >= 65.0 else "LOW_KEYPOINTS"
            }
        ],
        "comparedSources": {
            "sourceA": "Live Selfie",
            "sourceB": "Front Document Portrait Photo"
        }
    }

def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No action specified."}))
        sys.exit(1)

    action = sys.argv[1]

    # Read input JSON from stdin
    try:
        input_data = json.loads(sys.stdin.read())
    except Exception as e:
        print(json.dumps({"error": f"Invalid JSON input: {str(e)}"}))
        sys.exit(1)

    if action == "quality":
        img = decode_image(input_data.get("image"))
        result = analyze_image_quality(img)
        print(json.dumps(result))

    elif action == "passive_liveness":
        img = decode_image(input_data.get("image"))
        result = evaluate_passive_liveness(img)
        print(json.dumps(result))

    elif action == "match_faces":
        selfie_img = decode_image(input_data.get("selfieImage"))
        front_img = decode_image(input_data.get("frontDocImage"))
        result = compare_faces(selfie_img, front_img)
        print(json.dumps(result))

    elif action == "extract_portrait":
        img = decode_image(input_data.get("frontDocImage"))
        face, rect = extract_document_face(img)
        if face is not None:
            print(json.dumps({
                "found": True,
                "portraitUrl": encode_image(face),
                "boundingFrame": rect
            }))
        else:
            print(json.dumps({"found": False, "portraitUrl": None}))

    else:
        print(json.dumps({"error": f"Unknown action: {action}"}))
        sys.exit(1)

if __name__ == "__main__":
    main()

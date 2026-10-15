import React, { useState, useEffect, useRef } from 'react';
import { Search, ChevronDown, Check, Clock, Globe } from 'lucide-react';
const defaultDocs = [
    { id: 'Passport', name: 'International Passport', desc: 'Machine-readable travel passport', needsBack: false, icon: '🛂' },
    { id: 'National ID', name: 'National Identity Card', desc: 'Government issued national identity card', needsBack: true, icon: '🪪' },
    { id: 'Driver License', name: 'Driver License', desc: 'Valid regional/state driving permit', needsBack: true, icon: '🚘' },
    { id: 'Residence Permit', name: 'Residence Permit / Visa', desc: 'Official residency card or entry visa', needsBack: true, icon: '📜' }
];
export const countryList = [
    {
        code: 'ET',
        name: 'Ethiopia',
        nativeName: 'ኢትዮጵያ',
        flag: '🇪🇹',
        supportedDocs: [
            { id: 'National ID', name: 'National ID (Fayda)', desc: 'Biometric national identification card', needsBack: true, icon: '🪪' },
            { id: 'Passport', name: 'International Passport', desc: 'Machine readable Ethiopian passport', needsBack: false, icon: '🛂' },
            { id: 'Driver License', name: 'Driver License', desc: 'Valid regional/federal driving permit', needsBack: true, icon: '🚘' },
            { id: 'Residence Permit', name: 'Residence Permit (Yellow Card)', desc: 'Foreign national residence card', needsBack: true, icon: '📜' },
            { id: 'Government ID', name: 'Government ID', desc: 'Official civil service or military identity', needsBack: true, icon: '🏛️' },
            { id: 'Employee ID', name: 'Employee ID (Optional)', desc: 'Corporate employee badge', needsBack: false, icon: '🏢', optional: true }
        ]
    },
    {
        code: 'US',
        name: 'United States',
        nativeName: 'United States',
        flag: '🇺🇸',
        supportedDocs: [
            { id: 'Passport', name: 'US Passport / Passport Card', desc: 'Federal travel identification', needsBack: false, icon: '🛂' },
            { id: 'Driver License', name: 'Driver License / Real ID', desc: 'State issued driver identification', needsBack: true, icon: '🚘' },
            { id: 'National ID', name: 'State Identification Card', desc: 'Non-driver state identity document', needsBack: true, icon: '🪪' },
            { id: 'Residence Permit', name: 'Permanent Resident Card (Green Card)', desc: 'USCIS resident card', needsBack: true, icon: '📜' }
        ]
    },
    {
        code: 'GB',
        name: 'United Kingdom',
        nativeName: 'United Kingdom',
        flag: '🇬🇧',
        supportedDocs: [
            { id: 'Passport', name: 'UK Passport', desc: 'HM Passport Office travel document', needsBack: false, icon: '🛂' },
            { id: 'Driver License', name: 'UK Driving Licence', desc: 'DVLA photocard licence', needsBack: true, icon: '🚘' },
            { id: 'Residence Permit', name: 'Biometric Residence Permit (BRP)', desc: 'UKVI immigration permit', needsBack: true, icon: '📜' }
        ]
    },
    {
        code: 'AE',
        name: 'United Arab Emirates',
        nativeName: 'الإمارات العربية المتحدة',
        flag: '🇦🇪',
        supportedDocs: [
            { id: 'National ID', name: 'Emirates ID Card', desc: 'Federal Identity and Authority card', needsBack: true, icon: '🪪' },
            { id: 'Passport', name: 'UAE Passport', desc: 'Emirati travel passport', needsBack: false, icon: '🛂' },
            { id: 'Residence Permit', name: 'UAE Residency Visa', desc: 'Resident permit document', needsBack: true, icon: '📜' }
        ]
    },
    {
        code: 'KE',
        name: 'Kenya',
        nativeName: 'Kenya',
        flag: '🇰🇪',
        supportedDocs: [
            { id: 'National ID', name: 'National Identity Card (Huduma Card)', desc: 'Government issued Kenyan ID', needsBack: true, icon: '🪪' },
            { id: 'Passport', name: 'East African Kenyan Passport', desc: 'EAC biometric passport', needsBack: false, icon: '🛂' },
            { id: 'Driver License', name: 'NTSA Driving Licence', desc: 'Kenyan smart driving permit', needsBack: true, icon: '🚘' }
        ]
    },
    {
        code: 'ZA',
        name: 'South Africa',
        nativeName: 'South Africa',
        flag: '🇿🇦',
        supportedDocs: [
            { id: 'National ID', name: 'Smart ID Card', desc: 'Department of Home Affairs ID', needsBack: true, icon: '🪪' },
            { id: 'Passport', name: 'South African Passport', desc: 'Biometric travel passport', needsBack: false, icon: '🛂' },
            { id: 'Driver License', name: 'Driving Licence Card', desc: 'SADC valid driving licence', needsBack: true, icon: '🚘' }
        ]
    },
    {
        code: 'DE',
        name: 'Germany',
        nativeName: 'Deutschland',
        flag: '🇩🇪',
        supportedDocs: [
            { id: 'National ID', name: 'Personalausweis', desc: 'German national identity card', needsBack: true, icon: '🪪' },
            { id: 'Passport', name: 'Reisepass', desc: 'German biometric passport', needsBack: false, icon: '🛂' },
            { id: 'Driver License', name: 'Führerschein', desc: 'EU standard driving licence', needsBack: true, icon: '🚘' }
        ]
    },
    {
        code: 'FR',
        name: 'France',
        nativeName: 'France',
        flag: '🇫🇷',
        supportedDocs: [
            { id: 'National ID', name: "Carte Nationale d'Identité", desc: 'French national identity card', needsBack: true, icon: '🪪' },
            { id: 'Passport', name: 'Passeport Français', desc: 'Biometric French passport', needsBack: false, icon: '🛂' },
            { id: 'Driver License', name: 'Permis de Conduire', desc: 'French driving licence', needsBack: true, icon: '🚘' }
        ]
    },
    {
        code: 'IN',
        name: 'India',
        nativeName: 'भारत',
        flag: '🇮🇳',
        supportedDocs: [
            { id: 'National ID', name: 'Aadhaar Card / Voter ID', desc: 'UIDAI biometric identity card', needsBack: true, icon: '🪪' },
            { id: 'Passport', name: 'Indian Passport', desc: 'Republic of India passport', needsBack: false, icon: '🛂' },
            { id: 'Driver License', name: 'Driving Licence', desc: 'State Transport driving licence', needsBack: true, icon: '🚘' }
        ]
    },
    {
        code: 'CN',
        name: 'China',
        nativeName: '中国',
        flag: '🇨🇳',
        supportedDocs: [
            { id: 'National ID', name: 'Resident Identity Card (身份证)', desc: 'PRC Second-Generation ID Card', needsBack: true, icon: '🪪' },
            { id: 'Passport', name: 'Chinese Passport (护照)', desc: 'Biometric travel passport', needsBack: false, icon: '🛂' }
        ]
    },
    { code: 'AD', name: 'Andorra', nativeName: 'Andorra', flag: '🇦🇩', supportedDocs: defaultDocs },
    { code: 'AF', name: 'Afghanistan', nativeName: 'افغانستان', flag: '🇦🇫', supportedDocs: defaultDocs },
    { code: 'AG', name: 'Antigua and Barbuda', flag: '🇦🇬', supportedDocs: defaultDocs },
    { code: 'AI', name: 'Anguilla', flag: '🇦🇮', supportedDocs: defaultDocs },
    { code: 'AL', name: 'Albania', nativeName: 'Shqipëri', flag: '🇦🇱', supportedDocs: defaultDocs },
    { code: 'AM', name: 'Armenia', nativeName: 'Հայաստան', flag: '🇦🇲', supportedDocs: defaultDocs },
    { code: 'AO', name: 'Angola', flag: '🇦🇴', supportedDocs: defaultDocs },
    { code: 'AQ', name: 'Antarctica', flag: '🇦🇶', supportedDocs: defaultDocs },
    { code: 'AR', name: 'Argentina', flag: '🇦🇷', supportedDocs: defaultDocs },
    { code: 'AS', name: 'American Samoa', flag: '🇦🇸', supportedDocs: defaultDocs },
    { code: 'AT', name: 'Austria', nativeName: 'Österreich', flag: '🇦🇹', supportedDocs: defaultDocs },
    { code: 'AU', name: 'Australia', flag: '🇦🇺', supportedDocs: defaultDocs },
    { code: 'AW', name: 'Aruba', flag: '🇦🇼', supportedDocs: defaultDocs },
    { code: 'AX', name: 'Åland Islands', nativeName: 'Åland', flag: '🇦🇽', supportedDocs: defaultDocs },
    { code: 'AZ', name: 'Azerbaijan', nativeName: 'Azərbaycan', flag: '🇦🇿', supportedDocs: defaultDocs },
    { code: 'BA', name: 'Bosnia and Herzegovina', nativeName: 'Bosna i Hercegovina', flag: '🇧🇦', supportedDocs: defaultDocs },
    { code: 'BB', name: 'Barbados', flag: '🇧🇧', supportedDocs: defaultDocs },
    { code: 'BD', name: 'Bangladesh', nativeName: 'বাংলাদেশ', flag: '🇧🇩', supportedDocs: defaultDocs },
    { code: 'BE', name: 'Belgium', nativeName: 'België / Belgique', flag: '🇧🇪', supportedDocs: defaultDocs },
    { code: 'BF', name: 'Burkina Faso', flag: '🇧🇫', supportedDocs: defaultDocs },
    { code: 'BG', name: 'Bulgaria', nativeName: 'България', flag: '🇧🇬', supportedDocs: defaultDocs },
    { code: 'BH', name: 'Bahrain', nativeName: 'البحرين', flag: '🇧🇭', supportedDocs: defaultDocs },
    { code: 'BI', name: 'Burundi', nativeName: 'Uburundi', flag: '🇧🇮', supportedDocs: defaultDocs },
    { code: 'BJ', name: 'Benin', nativeName: 'Bénin', flag: '🇧🇯', supportedDocs: defaultDocs },
    { code: 'BL', name: 'Saint Barthélemy', nativeName: 'Saint-Barthélemy', flag: '🇧🇱', supportedDocs: defaultDocs },
    { code: 'BM', name: 'Bermuda', flag: '🇧🇲', supportedDocs: defaultDocs },
    { code: 'BN', name: 'Brunei', nativeName: 'Brunei Darussalam', flag: '🇧🇳', supportedDocs: defaultDocs },
    { code: 'BO', name: 'Bolivia', flag: '🇧🇴', supportedDocs: defaultDocs },
    { code: 'BQ', name: 'Bonaire, Sint Eustatius and Saba', flag: '🇧🇶', supportedDocs: defaultDocs },
    { code: 'BR', name: 'Brazil', nativeName: 'Brasil', flag: '🇧🇷', supportedDocs: defaultDocs },
    { code: 'BS', name: 'Bahamas', flag: '🇧🇸', supportedDocs: defaultDocs },
    { code: 'BT', name: 'Bhutan', nativeName: 'འབྲུག', flag: '🇧🇹', supportedDocs: defaultDocs },
    { code: 'BV', name: 'Bouvet Island', flag: '🇧🇻', supportedDocs: defaultDocs },
    { code: 'BW', name: 'Botswana', flag: '🇧🇼', supportedDocs: defaultDocs },
    { code: 'BY', name: 'Belarus', nativeName: 'Беларусь', flag: '🇧🇾', supportedDocs: defaultDocs },
    { code: 'BZ', name: 'Belize', flag: '🇧🇿', supportedDocs: defaultDocs },
    { code: 'CA', name: 'Canada', flag: '🇨🇦', supportedDocs: defaultDocs },
    { code: 'CC', name: 'Cocos (Keeling) Islands', flag: '🇨🇨', supportedDocs: defaultDocs },
    { code: 'CD', name: 'DR Congo', nativeName: 'République Démocratique du Congo', flag: '🇨🇩', supportedDocs: defaultDocs },
    { code: 'CF', name: 'Central African Republic', nativeName: 'République Centrafricaine', flag: '🇨🇫', supportedDocs: defaultDocs },
    { code: 'CG', name: 'Republic of the Congo', nativeName: 'République du Congo', flag: '🇨🇬', supportedDocs: defaultDocs },
    { code: 'CH', name: 'Switzerland', nativeName: 'Schweiz / Suisse', flag: '🇨🇭', supportedDocs: defaultDocs },
    { code: 'CI', name: 'Ivory Coast', nativeName: "Côte d'Ivoire", flag: '🇨🇮', supportedDocs: defaultDocs },
    { code: 'CK', name: 'Cook Islands', flag: '🇨🇰', supportedDocs: defaultDocs },
    { code: 'CL', name: 'Chile', flag: '🇨🇱', supportedDocs: defaultDocs },
    { code: 'CM', name: 'Cameroon', nativeName: 'Cameroun', flag: '🇨🇲', supportedDocs: defaultDocs },
    { code: 'CO', name: 'Colombia', flag: '🇨🇴', supportedDocs: defaultDocs },
    { code: 'CR', name: 'Costa Rica', flag: '🇨🇷', supportedDocs: defaultDocs },
    { code: 'CU', name: 'Cuba', flag: '🇨🇺', supportedDocs: defaultDocs },
    { code: 'CV', name: 'Cape Verde', nativeName: 'Cabo Verde', flag: '🇨🇻', supportedDocs: defaultDocs },
    { code: 'CW', name: 'Curaçao', flag: '🇨🇼', supportedDocs: defaultDocs },
    { code: 'CX', name: 'Christmas Island', flag: '🇨🇽', supportedDocs: defaultDocs },
    { code: 'CY', name: 'Cyprus', nativeName: 'Kýpros / Kıbrıs', flag: '🇨🇾', supportedDocs: defaultDocs },
    { code: 'CZ', name: 'Czech Republic', nativeName: 'Česká republika', flag: '🇨🇿', supportedDocs: defaultDocs },
    { code: 'DJ', name: 'Djibouti', nativeName: 'Jibouti', flag: '🇩🇯', supportedDocs: defaultDocs },
    { code: 'DK', name: 'Denmark', nativeName: 'Danmark', flag: '🇩🇰', supportedDocs: defaultDocs },
    { code: 'DM', name: 'Dominica', flag: '🇩🇲', supportedDocs: defaultDocs },
    { code: 'DO', name: 'Dominican Republic', nativeName: 'República Dominicana', flag: '🇩🇴', supportedDocs: defaultDocs },
    { code: 'DZ', name: 'Algeria', nativeName: 'الجزائر', flag: '🇩🇿', supportedDocs: defaultDocs },
    { code: 'EC', name: 'Ecuador', flag: '🇪🇨', supportedDocs: defaultDocs },
    { code: 'EE', name: 'Estonia', nativeName: 'Eesti', flag: '🇪🇪', supportedDocs: defaultDocs },
    { code: 'EG', name: 'Egypt', nativeName: 'مصر', flag: '🇪🇬', supportedDocs: defaultDocs },
    { code: 'EH', name: 'Western Sahara', nativeName: 'الصحراء الغربية', flag: '🇪🇭', supportedDocs: defaultDocs },
    { code: 'ER', name: 'Eritrea', nativeName: 'ኤርትራ', flag: '🇪🇷', supportedDocs: defaultDocs },
    { code: 'ES', name: 'Spain', nativeName: 'España', flag: '🇪🇸', supportedDocs: defaultDocs },
    { code: 'FI', name: 'Finland', nativeName: 'Suomi', flag: '🇫🇮', supportedDocs: defaultDocs },
    { code: 'FJ', name: 'Fiji', nativeName: 'Viti', flag: '🇫🇯', supportedDocs: defaultDocs },
    { code: 'FK', name: 'Falkland Islands', flag: '🇫🇰', supportedDocs: defaultDocs },
    { code: 'FM', name: 'Micronesia', flag: '🇫🇲', supportedDocs: defaultDocs },
    { code: 'FO', name: 'Faroe Islands', nativeName: 'Føroyar', flag: '🇫🇴', supportedDocs: defaultDocs },
    { code: 'GA', name: 'Gabon', flag: '🇬🇦', supportedDocs: defaultDocs },
    { code: 'GD', name: 'Grenada', flag: '🇬🇩', supportedDocs: defaultDocs },
    { code: 'GE', name: 'Georgia', nativeName: 'საქართველო', flag: '🇬🇪', supportedDocs: defaultDocs },
    { code: 'GF', name: 'French Guiana', nativeName: 'Guyane française', flag: '🇬🇫', supportedDocs: defaultDocs },
    { code: 'GG', name: 'Guernsey', flag: '🇬🇬', supportedDocs: defaultDocs },
    { code: 'GH', name: 'Ghana', flag: '🇬🇭', supportedDocs: defaultDocs },
    { code: 'GI', name: 'Gibraltar', flag: '🇬🇮', supportedDocs: defaultDocs },
    { code: 'GL', name: 'Greenland', nativeName: 'Kalaallit Nunaat', flag: '🇬🇱', supportedDocs: defaultDocs },
    { code: 'GM', name: 'Gambia', flag: '🇬🇲', supportedDocs: defaultDocs },
    { code: 'GN', name: 'Guinea', nativeName: 'Guinée', flag: '🇬🇳', supportedDocs: defaultDocs },
    { code: 'GP', name: 'Guadeloupe', flag: '🇬🇵', supportedDocs: defaultDocs },
    { code: 'GQ', name: 'Equatorial Guinea', nativeName: 'Guinea Ecuatorial', flag: '🇬🇶', supportedDocs: defaultDocs },
    { code: 'GR', name: 'Greece', nativeName: 'Ελλάδα', flag: '🇬🇷', supportedDocs: defaultDocs },
    { code: 'GS', name: 'South Georgia & South Sandwich Islands', flag: '🇬🇸', supportedDocs: defaultDocs },
    { code: 'GT', name: 'Guatemala', flag: '🇬🇹', supportedDocs: defaultDocs },
    { code: 'GU', name: 'Guam', flag: '🇬🇺', supportedDocs: defaultDocs },
    { code: 'GW', name: 'Guinea-Bissau', nativeName: 'Guiné-Bissau', flag: '🇬🇼', supportedDocs: defaultDocs },
    { code: 'GY', name: 'Guyana', flag: '🇬🇾', supportedDocs: defaultDocs },
    { code: 'HK', name: 'Hong Kong', nativeName: '香港', flag: '🇭🇰', supportedDocs: defaultDocs },
    { code: 'HM', name: 'Heard Island and McDonald Islands', flag: '🇭🇲', supportedDocs: defaultDocs },
    { code: 'HN', name: 'Honduras', flag: '🇭🇳', supportedDocs: defaultDocs },
    { code: 'HR', name: 'Croatia', nativeName: 'Hrvatska', flag: '🇭🇷', supportedDocs: defaultDocs },
    { code: 'HT', name: 'Haiti', nativeName: 'Haïti', flag: '🇭🇹', supportedDocs: defaultDocs },
    { code: 'HU', name: 'Hungary', nativeName: 'Magyarország', flag: '🇭🇺', supportedDocs: defaultDocs },
    { code: 'ID', name: 'Indonesia', flag: '🇮🇩', supportedDocs: defaultDocs },
    { code: 'IE', name: 'Ireland', nativeName: 'Éire', flag: '🇮🇪', supportedDocs: defaultDocs },
    { code: 'IL', name: 'Israel', nativeName: 'ישראל', flag: '🇮🇱', supportedDocs: defaultDocs },
    { code: 'IM', name: 'Isle of Man', flag: '🇮🇲', supportedDocs: defaultDocs },
    { code: 'IO', name: 'British Indian Ocean Territory', flag: '🇮🇴', supportedDocs: defaultDocs },
    { code: 'IQ', name: 'Iraq', nativeName: 'العراق', flag: '🇮🇶', supportedDocs: defaultDocs },
    { code: 'IR', name: 'Iran', nativeName: 'إيران', flag: '🇮🇷', supportedDocs: defaultDocs },
    { code: 'IS', name: 'Iceland', nativeName: 'Ísland', flag: '🇮🇸', supportedDocs: defaultDocs },
    { code: 'IT', name: 'Italy', nativeName: 'Italia', flag: '🇮🇹', supportedDocs: defaultDocs },
    { code: 'JE', name: 'Jersey', flag: '🇯🇪', supportedDocs: defaultDocs },
    { code: 'JM', name: 'Jamaica', flag: '🇯🇲', supportedDocs: defaultDocs },
    { code: 'JO', name: 'Jordan', nativeName: 'الأردن', flag: '🇯🇴', supportedDocs: defaultDocs },
    { code: 'JP', name: 'Japan', nativeName: '日本', flag: '🇯🇵', supportedDocs: defaultDocs },
    { code: 'KG', name: 'Kyrgyzstan', nativeName: 'Кыргызстан', flag: '🇰🇬', supportedDocs: defaultDocs },
    { code: 'KH', name: 'Cambodia', nativeName: 'កម្ពុជា', flag: '🇰🇭', supportedDocs: defaultDocs },
    { code: 'KI', name: 'Kiribati', flag: '🇰🇮', supportedDocs: defaultDocs },
    { code: 'KM', name: 'Comoros', nativeName: 'جزر القمر', flag: '🇰🇲', supportedDocs: defaultDocs },
    { code: 'KN', name: 'Saint Kitts and Nevis', flag: '🇰🇳', supportedDocs: defaultDocs },
    { code: 'KP', name: 'North Korea', nativeName: '조선', flag: '🇰🇵', supportedDocs: defaultDocs },
    { code: 'KR', name: 'South Korea', nativeName: '대한민국', flag: '🇰🇷', supportedDocs: defaultDocs },
    { code: 'KW', name: 'Kuwait', nativeName: 'الكويت', flag: '🇰🇼', supportedDocs: defaultDocs },
    { code: 'KY', name: 'Cayman Islands', flag: '🇰🇾', supportedDocs: defaultDocs },
    { code: 'KZ', name: 'Kazakhstan', nativeName: 'Қазақстан', flag: '🇰🇿', supportedDocs: defaultDocs },
    { code: 'LA', name: 'Laos', nativeName: 'ລາວ', flag: '🇱🇦', supportedDocs: defaultDocs },
    { code: 'LB', name: 'Lebanon', nativeName: 'لبنان', flag: '🇱🇧', supportedDocs: defaultDocs },
    { code: 'LC', name: 'Saint Lucia', flag: '🇱🇨', supportedDocs: defaultDocs },
    { code: 'LI', name: 'Liechtenstein', flag: '🇱🇮', supportedDocs: defaultDocs },
    { code: 'LK', name: 'Sri Lanka', nativeName: 'ශ්‍රී ලංකාව / இலங்கை', flag: '🇱🇰', supportedDocs: defaultDocs },
    { code: 'LR', name: 'Liberia', flag: '🇱🇷', supportedDocs: defaultDocs },
    { code: 'LS', name: 'Lesotho', flag: '🇱🇸', supportedDocs: defaultDocs },
    { code: 'LT', name: 'Lithuania', nativeName: 'Lietuva', flag: '🇱🇹', supportedDocs: defaultDocs },
    { code: 'LU', name: 'Luxembourg', flag: '🇱🇺', supportedDocs: defaultDocs },
    { code: 'LV', name: 'Latvia', nativeName: 'Latvija', flag: '🇱🇻', supportedDocs: defaultDocs },
    { code: 'LY', name: 'Libya', nativeName: 'ليبيا', flag: '🇱🇾', supportedDocs: defaultDocs },
    { code: 'MA', name: 'Morocco', nativeName: 'المغرب', flag: '🇲🇦', supportedDocs: defaultDocs },
    { code: 'MC', name: 'Monaco', flag: '🇲🇨', supportedDocs: defaultDocs },
    { code: 'MD', name: 'Moldova', flag: '🇲🇩', supportedDocs: defaultDocs },
    { code: 'ME', name: 'Montenegro', nativeName: 'Crna Gora', flag: '🇲🇪', supportedDocs: defaultDocs },
    { code: 'MF', name: 'Saint Martin', flag: '🇲🇫', supportedDocs: defaultDocs },
    { code: 'MG', name: 'Madagascar', flag: '🇲🇬', supportedDocs: defaultDocs },
    { code: 'MH', name: 'Marshall Islands', flag: '🇲🇭', supportedDocs: defaultDocs },
    { code: 'MK', name: 'North Macedonia', nativeName: 'Северна Македонија', flag: '🇲🇰', supportedDocs: defaultDocs },
    { code: 'ML', name: 'Mali', flag: '🇲🇱', supportedDocs: defaultDocs },
    { code: 'MM', name: 'Myanmar', nativeName: 'မြန်မာ', flag: '🇲🇲', supportedDocs: defaultDocs },
    { code: 'MN', name: 'Mongolia', nativeName: 'Монгол', flag: '🇲🇳', supportedDocs: defaultDocs },
    { code: 'MO', name: 'Macao', nativeName: '澳門', flag: '🇲🇴', supportedDocs: defaultDocs },
    { code: 'MP', name: 'Northern Mariana Islands', flag: '🇲🇵', supportedDocs: defaultDocs },
    { code: 'MQ', name: 'Martinique', flag: '🇲🇶', supportedDocs: defaultDocs },
    { code: 'MR', name: 'Mauritania', nativeName: 'موريتانيا', flag: '🇲🇷', supportedDocs: defaultDocs },
    { code: 'MS', name: 'Montserrat', flag: '🇲🇸', supportedDocs: defaultDocs },
    { code: 'MT', name: 'Malta', flag: '🇲🇹', supportedDocs: defaultDocs },
    { code: 'MU', name: 'Mauritius', nativeName: 'Maurice', flag: '🇲🇺', supportedDocs: defaultDocs },
    { code: 'MV', name: 'Maldives', nativeName: 'ދިވެހިރާއްޖެ', flag: '🇲🇻', supportedDocs: defaultDocs },
    { code: 'MW', name: 'Malawi', flag: '🇲🇼', supportedDocs: defaultDocs },
    { code: 'MX', name: 'Mexico', nativeName: 'México', flag: '🇲🇽', supportedDocs: defaultDocs },
    { code: 'MY', name: 'Malaysia', flag: '🇲🇾', supportedDocs: defaultDocs },
    { code: 'MZ', name: 'Mozambique', nativeName: 'Moçambique', flag: '🇲🇿', supportedDocs: defaultDocs },
    { code: 'NA', name: 'Namibia', flag: '🇳🇦', supportedDocs: defaultDocs },
    { code: 'NC', name: 'New Caledonia', nativeName: 'Nouvelle-Calédonie', flag: '🇳🇨', supportedDocs: defaultDocs },
    { code: 'NE', name: 'Niger', flag: '🇳🇪', supportedDocs: defaultDocs },
    { code: 'NF', name: 'Norfolk Island', flag: '🇳🇫', supportedDocs: defaultDocs },
    { code: 'NG', name: 'Nigeria', flag: '🇳🇬', supportedDocs: defaultDocs },
    { code: 'NI', name: 'Nicaragua', flag: '🇳🇮', supportedDocs: defaultDocs },
    { code: 'NL', name: 'Netherlands', nativeName: 'Nederland', flag: '🇳🇱', supportedDocs: defaultDocs },
    { code: 'NO', name: 'Norway', nativeName: 'Norge', flag: '🇳🇴', supportedDocs: defaultDocs },
    { code: 'NP', name: 'Nepal', nativeName: 'नेपाल', flag: '🇳🇵', supportedDocs: defaultDocs },
    { code: 'NR', name: 'Nauru', flag: '🇳🇷', supportedDocs: defaultDocs },
    { code: 'NU', name: 'Niue', flag: '🇳🇺', supportedDocs: defaultDocs },
    { code: 'NZ', name: 'New Zealand', nativeName: 'Aotearoa', flag: '🇳🇿', supportedDocs: defaultDocs },
    { code: 'OM', name: 'Oman', nativeName: 'عُمان', flag: '🇴🇲', supportedDocs: defaultDocs },
    { code: 'PA', name: 'Panama', nativeName: 'Panamá', flag: '🇵🇦', supportedDocs: defaultDocs },
    { code: 'PE', name: 'Peru', nativeName: 'Perú', flag: '🇵🇪', supportedDocs: defaultDocs },
    { code: 'PF', name: 'French Polynesia', nativeName: 'Polynésie française', flag: '🇵🇫', supportedDocs: defaultDocs },
    { code: 'PG', name: 'Papua New Guinea', flag: '🇵🇬', supportedDocs: defaultDocs },
    { code: 'PH', name: 'Philippines', nativeName: 'Pilipinas', flag: '🇵🇭', supportedDocs: defaultDocs },
    { code: 'PK', name: 'Pakistan', nativeName: 'پاکستان', flag: '🇵🇰', supportedDocs: defaultDocs },
    { code: 'PL', name: 'Poland', nativeName: 'Polska', flag: '🇵🇱', supportedDocs: defaultDocs },
    { code: 'PM', name: 'Saint Pierre and Miquelon', flag: '🇵🇲', supportedDocs: defaultDocs },
    { code: 'PN', name: 'Pitcairn Islands', flag: '🇵🇳', supportedDocs: defaultDocs },
    { code: 'PR', name: 'Puerto Rico', flag: '🇵🇷', supportedDocs: defaultDocs },
    { code: 'PS', name: 'Palestine', nativeName: 'فلسطين', flag: '🇵🇸', supportedDocs: defaultDocs },
    { code: 'PT', name: 'Portugal', flag: '🇵🇹', supportedDocs: defaultDocs },
    { code: 'PW', name: 'Palau', flag: '🇵🇼', supportedDocs: defaultDocs },
    { code: 'PY', name: 'Paraguay', flag: '🇵🇾', supportedDocs: defaultDocs },
    { code: 'QA', name: 'Qatar', nativeName: 'قطر', flag: '🇶🇦', supportedDocs: defaultDocs },
    { code: 'RE', name: 'Réunion', flag: '🇷🇪', supportedDocs: defaultDocs },
    { code: 'RO', name: 'Romania', nativeName: 'România', flag: '🇷🇴', supportedDocs: defaultDocs },
    { code: 'RS', name: 'Serbia', nativeName: 'Србија', flag: '🇷🇸', supportedDocs: defaultDocs },
    { code: 'RU', name: 'Russia', nativeName: 'Россия', flag: '🇷🇺', supportedDocs: defaultDocs },
    { code: 'RW', name: 'Rwanda', flag: '🇷🇼', supportedDocs: defaultDocs },
    { code: 'SA', name: 'Saudi Arabia', nativeName: 'المملكة العربية السعودية', flag: '🇸🇦', supportedDocs: defaultDocs },
    { code: 'SB', name: 'Solomon Islands', flag: '🇸🇧', supportedDocs: defaultDocs },
    { code: 'SC', name: 'Seychelles', flag: '🇸🇨', supportedDocs: defaultDocs },
    { code: 'SD', name: 'Sudan', nativeName: 'السودان', flag: '🇸🇩', supportedDocs: defaultDocs },
    { code: 'SE', name: 'Sweden', nativeName: 'Sverige', flag: '🇸🇪', supportedDocs: defaultDocs },
    { code: 'SG', name: 'Singapore', nativeName: 'Singapura', flag: '🇸🇬', supportedDocs: defaultDocs },
    { code: 'SH', name: 'Saint Helena', flag: '🇸🇭', supportedDocs: defaultDocs },
    { code: 'SI', name: 'Slovenia', nativeName: 'Slovenija', flag: '🇸🇮', supportedDocs: defaultDocs },
    { code: 'SJ', name: 'Svalbard and Jan Mayen', flag: '🇸🇯', supportedDocs: defaultDocs },
    { code: 'SK', name: 'Slovakia', nativeName: 'Slovensko', flag: '🇸🇰', supportedDocs: defaultDocs },
    { code: 'SL', name: 'Sierra Leone', flag: '🇸🇱', supportedDocs: defaultDocs },
    { code: 'SM', name: 'San Marino', flag: '🇸🇲', supportedDocs: defaultDocs },
    { code: 'SN', name: 'Senegal', nativeName: 'Sénégal', flag: '🇸🇳', supportedDocs: defaultDocs },
    { code: 'SO', name: 'Somalia', nativeName: 'Soomaaliya', flag: '🇸🇴', supportedDocs: defaultDocs },
    { code: 'SR', name: 'Suriname', flag: '🇸🇷', supportedDocs: defaultDocs },
    { code: 'SS', name: 'South Sudan', nativeName: 'جنوب السودان', flag: '🇸🇸', supportedDocs: defaultDocs },
    { code: 'ST', name: 'São Tomé and Príncipe', flag: '🇸🇹', supportedDocs: defaultDocs },
    { code: 'SV', name: 'El Salvador', flag: '🇸🇻', supportedDocs: defaultDocs },
    { code: 'SX', name: 'Sint Maarten', flag: '🇸🇽', supportedDocs: defaultDocs },
    { code: 'SY', name: 'Syria', nativeName: 'سوريا', flag: '🇸🇾', supportedDocs: defaultDocs },
    { code: 'SZ', name: 'Eswatini', nativeName: 'Swaziland', flag: '🇸🇿', supportedDocs: defaultDocs },
    { code: 'TC', name: 'Turks and Caicos Islands', flag: '🇹🇨', supportedDocs: defaultDocs },
    { code: 'TD', name: 'Chad', nativeName: 'Tchad / تشاد', flag: '🇹🇩', supportedDocs: defaultDocs },
    { code: 'TF', name: 'French Southern Territories', flag: '🇹🇫', supportedDocs: defaultDocs },
    { code: 'TG', name: 'Togo', flag: '🇹🇬', supportedDocs: defaultDocs },
    { code: 'TH', name: 'Thailand', nativeName: 'ประเทศไทย', flag: '🇹🇭', supportedDocs: defaultDocs },
    { code: 'TJ', name: 'Tajikistan', nativeName: 'Тоҷикистон', flag: '🇹🇯', supportedDocs: defaultDocs },
    { code: 'TK', name: 'Tokelau', flag: '🇹🇰', supportedDocs: defaultDocs },
    { code: 'TL', name: 'Timor-Leste', flag: '🇹🇱', supportedDocs: defaultDocs },
    { code: 'TM', name: 'Turkmenistan', nativeName: 'Türkmenistan', flag: '🇹🇲', supportedDocs: defaultDocs },
    { code: 'TN', name: 'Tunisia', nativeName: 'تونس', flag: '🇹🇳', supportedDocs: defaultDocs },
    { code: 'TO', name: 'Tonga', flag: '🇹🇴', supportedDocs: defaultDocs },
    { code: 'TR', name: 'Turkey', nativeName: 'Türkiye', flag: '🇹🇷', supportedDocs: defaultDocs },
    { code: 'TT', name: 'Trinidad and Tobago', flag: '🇹🇹', supportedDocs: defaultDocs },
    { code: 'TV', name: 'Tuvalu', flag: '🇹🇻', supportedDocs: defaultDocs },
    { code: 'TW', name: 'Taiwan', nativeName: '台灣', flag: '🇹🇼', supportedDocs: defaultDocs },
    { code: 'TZ', name: 'Tanzania', flag: '🇹🇿', supportedDocs: defaultDocs },
    { code: 'UA', name: 'Ukraine', nativeName: 'Україна', flag: '🇺🇦', supportedDocs: defaultDocs },
    { code: 'UG', name: 'Uganda', flag: '🇺🇬', supportedDocs: defaultDocs },
    { code: 'UM', name: 'US Outlying Islands', flag: '🇺🇲', supportedDocs: defaultDocs },
    { code: 'UY', name: 'Uruguay', flag: '🇺🇾', supportedDocs: defaultDocs },
    { code: 'UZ', name: 'Uzbekistan', nativeName: "Oʻzbekiston", flag: '🇺🇿', supportedDocs: defaultDocs },
    { code: 'VA', name: 'Vatican City', nativeName: 'Città del Vaticano', flag: '🇻🇦', supportedDocs: defaultDocs },
    { code: 'VC', name: 'Saint Vincent and the Grenadines', flag: '🇻🇨', supportedDocs: defaultDocs },
    { code: 'VE', name: 'Venezuela', flag: '🇻🇪', supportedDocs: defaultDocs },
    { code: 'VG', name: 'British Virgin Islands', flag: '🇻🇬', supportedDocs: defaultDocs },
    { code: 'VI', name: 'US Virgin Islands', flag: '🇻🇮', supportedDocs: defaultDocs },
    { code: 'VN', name: 'Vietnam', nativeName: 'Việt Nam', flag: '🇻🇳', supportedDocs: defaultDocs },
    { code: 'VU', name: 'Vanuatu', flag: '🇻🇺', supportedDocs: defaultDocs },
    { code: 'WF', name: 'Wallis and Futuna', flag: '🇼🇫', supportedDocs: defaultDocs },
    { code: 'WS', name: 'Samoa', flag: '🇼🇸', supportedDocs: defaultDocs },
    { code: 'XK', name: 'Kosovo', nativeName: 'Kosovë', flag: '🇽🇰', supportedDocs: defaultDocs },
    { code: 'YE', name: 'Yemen', nativeName: 'اليمن', flag: '🇾🇪', supportedDocs: defaultDocs },
    { code: 'YT', name: 'Mayotte', flag: '🇾🇹', supportedDocs: defaultDocs },
    { code: 'ZM', name: 'Zambia', flag: '🇿🇲', supportedDocs: defaultDocs },
    { code: 'ZW', name: 'Zimbabwe', flag: '🇿🇼', supportedDocs: defaultDocs }
];
// Helper to render flag (Image flag with fallback to Emoji + ISO Code badge)
const CountryFlagDisplay = ({ code, flagEmoji, className = "text-xl" }) => {
    const [imgFailed, setImgFailed] = useState(false);
    if (!imgFailed) {
        return (<div className="relative inline-flex items-center shrink-0">
        <img src={`https://flagcdn.com/w40/${code.toLowerCase()}.png`} alt={code} onError={() => setImgFailed(true)} className="w-7 h-5 object-cover rounded shadow-sm border border-slate-700/60 shrink-0"/>
      </div>);
    }
    return (<div className="inline-flex items-center gap-1 shrink-0">
      <span className={className} role="img" aria-label={code}>{flagEmoji}</span>
      <span className="text-[10px] font-bold bg-slate-800 text-slate-300 px-1 py-0.5 rounded border border-slate-700 font-mono">
        {code}
      </span>
    </div>);
};
export const CountrySelector = ({ selectedCountry, onSelectCountry }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [recentlyUsed, setRecentlyUsed] = useState([countryList[0], countryList[1]]);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const containerRef = useRef(null);
    const searchInputRef = useRef(null);
    const filteredCountries = countryList.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.nativeName && c.nativeName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        c.code.toLowerCase().includes(searchQuery.toLowerCase()));
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);
    useEffect(() => {
        if (isOpen && searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, [isOpen]);
    const handleSelect = (c) => {
        onSelectCountry(c);
        setIsOpen(false);
        setSearchQuery('');
        // Update recently used
        if (!recentlyUsed.some(r => r.code === c.code)) {
            setRecentlyUsed([c, ...recentlyUsed.slice(0, 2)]);
        }
    };
    const handleKeyDown = (e) => {
        if (!isOpen) {
            if (e.key === 'Enter' || e.key === 'ArrowDown') {
                setIsOpen(true);
            }
            return;
        }
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex(prev => (prev + 1) % filteredCountries.length);
        }
        else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex(prev => (prev - 1 + filteredCountries.length) % filteredCountries.length);
        }
        else if (e.key === 'Enter') {
            e.preventDefault();
            if (filteredCountries[selectedIndex]) {
                handleSelect(filteredCountries[selectedIndex]);
            }
        }
        else if (e.key === 'Escape') {
            setIsOpen(false);
        }
    };
    return (<div className="relative w-full" ref={containerRef} onKeyDown={handleKeyDown}>
      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
        Issuing Country / Territory *
      </label>

      {/* Selected Box */}
      <button type="button" onClick={() => setIsOpen(!isOpen)} className="w-full flex items-center justify-between bg-slate-900 border border-slate-700 hover:border-emerald-500 rounded-xl px-4 py-3 text-white transition-all shadow-md focus:outline-none focus:ring-2 focus:ring-emerald-500/50">
        <div className="flex items-center gap-3">
          <CountryFlagDisplay code={selectedCountry.code} flagEmoji={selectedCountry.flag} className="text-2xl"/>
          <div className="text-left">
            <div className="flex items-center gap-2">
              <span className="block text-sm font-bold text-white">{selectedCountry.name}</span>
              {selectedCountry.nativeName && selectedCountry.nativeName !== selectedCountry.name && (<span className="text-xs text-slate-400 font-normal">({selectedCountry.nativeName})</span>)}
            </div>
            <span className="block text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
              {selectedCountry.supportedDocs.length} Document Types Supported
            </span>
          </div>
        </div>
        <ChevronDown size={18} className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}/>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (<div className="absolute z-50 mt-2 w-full bg-slate-950 border border-slate-800 rounded-xl shadow-2xl overflow-hidden backdrop-blur-xl animate-in fade-in slide-in-from-top-2">
          {/* Search Box */}
          <div className="p-3 border-b border-slate-800 bg-slate-900/60 flex items-center gap-2">
            <Search size={16} className="text-slate-400 shrink-0"/>
            <input ref={searchInputRef} type="text" placeholder="Search country by name or code..." value={searchQuery} onChange={e => { setSearchQuery(e.target.value); setSelectedIndex(0); }} className="w-full bg-transparent border-none text-xs text-white placeholder-slate-500 focus:outline-none font-medium"/>
          </div>

          {/* Recently Used */}
          {!searchQuery && recentlyUsed.length > 0 && (<div className="px-3 py-2 border-b border-slate-900 bg-slate-900/30">
              <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                <Clock size={11} className="text-amber-400"/> Recently Used
              </div>
              <div className="flex gap-2 flex-wrap">
                {recentlyUsed.map(c => (<button key={c.code} type="button" onClick={() => handleSelect(c)} className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-semibold text-slate-200 border border-slate-700 transition-colors">
                    <CountryFlagDisplay code={c.code} flagEmoji={c.flag} className="text-sm"/>
                    <span>{c.name}</span>
                  </button>))}
              </div>
            </div>)}

          {/* Country List */}
          <div className="max-h-64 overflow-y-auto p-1 divide-y divide-slate-900">
            {filteredCountries.length > 0 ? (filteredCountries.map((c, index) => {
                const isSelected = c.code === selectedCountry.code;
                const isHighlighted = index === selectedIndex;
                return (<button key={c.code} type="button" onClick={() => handleSelect(c)} className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left text-xs font-semibold transition-all ${isSelected
                        ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-800/40'
                        : isHighlighted
                            ? 'bg-slate-800/80 text-white'
                            : 'text-slate-300 hover:bg-slate-900 hover:text-white'}`}>
                    <div className="flex items-center gap-3">
                      <CountryFlagDisplay code={c.code} flagEmoji={c.flag}/>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold block text-sm text-white">{c.name}</span>
                          {c.nativeName && c.nativeName !== c.name && (<span className="text-xs text-slate-400 font-normal">({c.nativeName})</span>)}
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono">ISO: {c.code}</span>
                      </div>
                    </div>
                    {isSelected && <Check size={16} className="text-emerald-400 shrink-0"/>}
                  </button>);
            })) : (<div className="p-4 text-center text-xs text-slate-500">
                <Globe size={24} className="mx-auto mb-1.5 opacity-40"/>
                No matching country found.
              </div>)}
          </div>
        </div>)}
    </div>);
};
export default CountrySelector;

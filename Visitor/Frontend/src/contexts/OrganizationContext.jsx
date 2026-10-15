import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';
const DEFAULT_ORGANIZATION = {
    id: 1,
    name: 'IT Park',
    shortName: 'ITP',
    code: 'ITP01',
    email: 'info@ethiopianitpark.et',
    phone: '+251 11 123 4567',
    website: 'https://ethiopianitpark.et/',
    address: 'Bole Sub-City, IT Park',
    country: 'Ethiopia',
    region: 'Addis Ababa',
    city: 'Addis Ababa',
    subCity: 'Bole',
    woreda: '',
    postalCode: '',
    logoUrl: '/logo.png',
    faviconUrl: '',
    primaryColor: '#2563eb',
    secondaryColor: '#1e40af',
};
const CACHE_KEY = 'vms_org_branding';
const OrganizationContext = createContext(undefined);
export const OrganizationProvider = ({ children }) => {
    const [organization, setOrganization] = useState(() => {
        try {
            const cached = localStorage.getItem(CACHE_KEY);
            if (cached) {
                const parsed = JSON.parse(cached);
                return { ...DEFAULT_ORGANIZATION, ...parsed };
            }
        }
        catch {
            // Ignore cache parse error
        }
        return DEFAULT_ORGANIZATION;
    });
    const [loading, setLoading] = useState(false);
    const fetchOrganization = useCallback(async () => {
        try {
            setLoading(true);
            // Try dedicated public branding endpoint first
            let data = null;
            try {
                const res = await api.get('/organizations/public-branding');
                if (res.data)
                    data = res.data;
            }
            catch {
                // Fallback to /organizations/public
                try {
                    const res = await api.get('/organizations/public');
                    if (Array.isArray(res.data) && res.data.length > 0) {
                        const org = res.data[0];
                        data = {
                            id: org.id,
                            name: org.name,
                            shortName: org.short_name || org.shortName || 'VMS',
                            code: org.code,
                            email: org.email || '',
                            phone: org.phone || '',
                            website: org.website || '',
                            address: org.address || '',
                            country: org.country || '',
                            region: org.region || '',
                            city: org.city || '',
                            subCity: org.sub_city || org.subCity || '',
                            woreda: org.woreda || '',
                            postalCode: org.postal_code || org.postalCode || '',
                            logoUrl: org.logo_url || org.logoUrl || '/logo.png',
                            faviconUrl: org.favicon_url || org.faviconUrl || '',
                            primaryColor: org.primary_color || org.primaryColor || '#2563eb',
                            secondaryColor: org.secondary_color || org.secondaryColor || '#1e40af',
                        };
                    }
                }
                catch {
                    // Both failed, ignore and keep current state
                }
            }
            if (data && data.name) {
                const updatedOrg = {
                    id: data.id || DEFAULT_ORGANIZATION.id,
                    name: data.name || DEFAULT_ORGANIZATION.name,
                    shortName: data.shortName || data.short_name || DEFAULT_ORGANIZATION.shortName,
                    code: data.code || DEFAULT_ORGANIZATION.code,
                    email: data.email || DEFAULT_ORGANIZATION.email,
                    phone: data.phone || DEFAULT_ORGANIZATION.phone,
                    website: data.website || DEFAULT_ORGANIZATION.website,
                    address: data.address || DEFAULT_ORGANIZATION.address,
                    country: data.country || DEFAULT_ORGANIZATION.country,
                    region: data.region || DEFAULT_ORGANIZATION.region,
                    city: data.city || DEFAULT_ORGANIZATION.city,
                    subCity: data.subCity || data.sub_city || DEFAULT_ORGANIZATION.subCity,
                    woreda: data.woreda || DEFAULT_ORGANIZATION.woreda,
                    postalCode: data.postalCode || data.postal_code || DEFAULT_ORGANIZATION.postalCode,
                    logoUrl: data.logoUrl || data.logo_url || DEFAULT_ORGANIZATION.logoUrl,
                    faviconUrl: data.faviconUrl || data.favicon_url || DEFAULT_ORGANIZATION.faviconUrl,
                    primaryColor: data.primaryColor || data.primary_color || DEFAULT_ORGANIZATION.primaryColor,
                    secondaryColor: data.secondaryColor || data.secondary_color || DEFAULT_ORGANIZATION.secondaryColor,
                };
                setOrganization(updatedOrg);
                try {
                    localStorage.setItem(CACHE_KEY, JSON.stringify(updatedOrg));
                }
                catch {
                    // localStorage full or restricted
                }
            }
        }
        catch {
            // Keep existing state on error
        }
        finally {
            setLoading(false);
        }
    }, []);
    useEffect(() => {
        fetchOrganization();
    }, [fetchOrganization]);
    const updateLocalOrganization = useCallback((data) => {
        setOrganization((prev) => {
            const updated = { ...prev, ...data };
            try {
                localStorage.setItem(CACHE_KEY, JSON.stringify(updated));
            }
            catch {
                // Ignore
            }
            return updated;
        });
    }, []);
    const logoUrl = organization.logoUrl || '/logo.png';
    const orgName = organization.name || 'Enterprise VMS';
    const orgEmail = organization.email || 'support@vms.com';
    const orgPhone = organization.phone || '+251 11 123 4567';
    const orgWebsite = organization.website || '';
    return (<OrganizationContext.Provider value={{
            organization,
            loading,
            refreshOrganization: fetchOrganization,
            updateLocalOrganization,
            logoUrl,
            orgName,
            orgEmail,
            orgPhone,
            orgWebsite,
        }}>
      {children}
    </OrganizationContext.Provider>);
};
export const useOrganization = () => {
    const context = useContext(OrganizationContext);
    if (!context) {
        throw new Error('useOrganization must be used within an OrganizationProvider');
    }
    return context;
};

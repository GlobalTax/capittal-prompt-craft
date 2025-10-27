import { useState, useEffect } from 'react';
import { organizationRepository, Organization } from '@/repositories/OrganizationRepository';
import { useAuthContext } from '@/components/auth/AuthProvider';

export const useOrganization = () => {
  const { user } = useAuthContext();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrganization = async () => {
      if (!user) {
        setOrganization(null);
        setLoading(false);
        return;
      }

      try {
        const org = await organizationRepository.getUserOrganization(user.id);
        setOrganization(org);
      } catch (error) {
        console.error('Error fetching organization:', error);
        setOrganization(null);
      } finally {
        setLoading(false);
      }
    };

    fetchOrganization();
  }, [user]);

  return {
    organization,
    loading
  };
};

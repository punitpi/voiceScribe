import { useAuth } from '../contexts/AuthContext';

export const useFeatureFlag = (flagName: string): boolean => {
  const { user } = useAuth();
  return user?.flags?.[flagName] ?? false;
};

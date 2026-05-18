import { create } from 'zustand';

type PageState = {
  isPageLoading: boolean;
  setPageLoading: (loading: boolean) => void;
};

export const usePageState = create<PageState>((set) => ({
  isPageLoading: false,
  setPageLoading: (loading: boolean) => set({ isPageLoading: loading }),
}));

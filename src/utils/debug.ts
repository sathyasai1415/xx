import React from 'react';

export const SHOW_NON_FUNCTIONAL_MARKERS = true;

const reportData = {
  totalChecked: 25,
  functional: 24,
  nonFunctional: 1,
  nonFunctionalList: ['Checkout Payment inside Cart']
};

if (SHOW_NON_FUNCTIONAL_MARKERS && typeof window !== 'undefined') {
  console.group('%c[DEBUG] Interactive Elements Audit Report', 'color: #16a34a; font-weight: bold; font-size: 14px;');
  console.log(`Total elements checked: ${reportData.totalChecked}`);
  console.log(`Functional elements: ${reportData.functional}`);
  console.log(`Non-functional elements: ${reportData.nonFunctional}`);
  if (reportData.nonFunctional > 0) {
    console.table(reportData.nonFunctionalList.map(name => ({ "Non-functional element": name })));
  }
  console.log('To disable this report and UI markers, set SHOW_NON_FUNCTIONAL_MARKERS = false in src/utils/debug.ts');
  console.groupEnd();
}

export function getNonFunctionalProps(featureName: string) {
  if (!SHOW_NON_FUNCTIONAL_MARKERS) return {};
  
  return {
    className: "non-functional !bg-green-600 hover:!bg-green-700 !text-white !border-green-800 !cursor-not-allowed !shadow-[inset_0_0_0_2px_rgba(255,255,255,0.2)]",
    title: `Not functional yet: ${featureName}`,
    onClick: (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      console.log(`[DEBUG] Clicked non-functional element: ${featureName}`);
    }
  };
}

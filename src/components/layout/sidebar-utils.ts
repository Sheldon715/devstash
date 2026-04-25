export function getSidebarContentVisibilityClass(isCollapsed: boolean) {
  return isCollapsed
    ? "pointer-events-none w-0 max-w-0 -translate-x-2 opacity-0"
    : "w-auto max-w-[220px] translate-x-0 opacity-100";
}

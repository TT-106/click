/** 保留遗留 DOM 的身份及事件；只移动节点，不复制会失效的 onclick。 */
export function mountExpedition() {
  const placements = { gameCanvas: 'map-stage', treasureChestLootButtonPanel: 'map-stage', upgradeButtonContainer: 'upgrades-mount', scrollButtonContainer: 'scrolls-mount', potionButtonContainer: 'potions-mount' };
  for (const [id, target] of Object.entries(placements)) {
    const node = document.getElementById(id), mount = document.getElementById(target);
    if (node && node.parentElement !== mount) mount.append(node);
  }
  const canvas = document.getElementById('gameCanvas');
  if (canvas) { canvas.setAttribute('role', 'img'); canvas.setAttribute('aria-label', '冒险队伍实时探索地图'); }
}

const controls = '.upgradeButton,.ownedUpgradeButton,.saveButton,.lootButton,.scrollButton,.potionButton,.tabMenu a,.equipButton,.sellButton,.deselectCharacterButton,.moveUpButton,.moveDownButton';
export function enhanceLegacyControls(root) {
  const enhance = () => {
    for (const element of root.querySelectorAll(controls)) {
      if (element.matches('button,input,a[href]')) continue;
      element.setAttribute('role', 'button');
      element.tabIndex = element.className.toString().toLowerCase().includes('disabled') ? -1 : 0;
    }
    for (const element of root.querySelectorAll('[role="button"]')) {
      const disabled = /disabled|Disabled/.test(element.className);
      element.setAttribute('aria-disabled', String(disabled));
      element.tabIndex = disabled ? -1 : 0;
    }
  };
  let scheduled = false;
  const observer = new MutationObserver(() => {
    if (!scheduled) { scheduled = true; setTimeout(() => { enhance(); scheduled = false; }, 150); }
  });
  observer.observe(root, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
  root.addEventListener('keydown', event => {
    if (!['Enter', ' '].includes(event.key)) return;
    const element = event.target.closest('[role="button"]');
    if (!element || element.getAttribute('aria-disabled') === 'true') return;
    event.preventDefault();
    if (typeof element.onmouseup === 'function') element.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
    else element.click();
  });
  enhance();
  return () => observer.disconnect();
}

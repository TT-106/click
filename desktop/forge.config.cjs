module.exports = async () => {
  const { default: definitions } = await import('../src/data/assets.generated.js');
  const images = new Set(['assets/vendor/rubberduck-isometric-plants/bush.png']);
  const collect = value => {
    if (!value || typeof value !== 'object') return;
    for (const [key, child] of Object.entries(value)) {
      if (key === 'image' && typeof child === 'string') images.add(child.replace(/^\//, ''));
      else collect(child);
    }
  };
  collect(definitions);
  return {
  outDir: 'output/desktop-build',
  packagerConfig: {
    asar: true,
    name: 'WildernessCompanion',
    executableName: 'WildernessCompanion',
    // 只打包桌面入口、静态发布产物和实际运行依赖；不带档案、测试、开发记录。
    ignore: file => {
      const normalized = file.replaceAll('\\', '/');
      if (Boolean(file) && !/^\/(package\.json$|desktop(?:\/|$)|dist(?:\/|$)|node_modules(?:\/|$))/.test(normalized)) return true;
      // 素材仓库保留完整库存；试用包仅带资源清单实际引用的位图，许可证和描述文件仍保留。
      return /^\/dist\/assets\/.*\.(png|jpe?g|webp|gif)$/i.test(normalized) && !images.has(normalized.slice('/dist/'.length));
    },
  },
  makers: [{ name: '@electron-forge/maker-zip', platforms: ['win32'] }],
  };
};

// 诊断辅助：打印 .Ob()/.Pb() 全部调用行内容，供按接收者分类。
const { execSync } = require('child_process');
const fs = require('fs');
const out = execSync('grep -rn "\\\\.Ob(\\\\|\\\\.Pb(" src/engine --include=*.js', { encoding: 'utf8' });
for (const line of out.split('\n').filter(Boolean)) {
  const m = line.match(/^(.*?):(\d+):(.*)$/);
  if (!m) continue;
  const file = m[1].split('\\').join('/');
  const content = (m[3] || '').trim().slice(0, 120);
  console.log(file + ':' + m[2] + '  >>  ' + content);
}

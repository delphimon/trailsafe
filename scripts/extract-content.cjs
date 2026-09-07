// Extract only data literals from the reference; never execute the prototype script.
const fs = require('node:fs');
const parser = require('@babel/parser');
const html = fs.readFileSync('docs/reference/kcesar-trailsafe.html', 'utf8');
const ast = parser.parse(html.match(/<script>([\s\S]*?)<\/script>/)[1]);
function literal(n) {
  if (n.type === 'StringLiteral' || n.type === 'NumericLiteral' || n.type === 'BooleanLiteral') return n.value;
  if (n.type === 'ArrayExpression') return n.elements.map(literal);
  if (n.type === 'ObjectExpression') return Object.fromEntries(n.properties.map(p => [p.key.name || p.key.value, literal(p.value)]));
  if (n.type === 'BinaryExpression' && n.operator === '+') return literal(n.left) + literal(n.right);
  // The two dynamic list articles are rebuilt explicitly below.
  if (n.type === 'CallExpression') return '';
  throw new Error('Unsupported data expression: ' + n.type);
}
const names = ['ESSENTIALS','PHONE_CHECKLIST','ADD_ONS','RESOURCES','GUIDE_TOPICS','ARTICLES'];
const data = {};
for (const n of ast.program.body) if(n.type === 'VariableDeclaration') for(const d of n.declarations) if(names.includes(d.id.name)) data[d.id.name] = literal(d.init);
data.ARTICLES['ten-essentials'].body = '<p>The ten systems in the TrailSafe preparation checklist.</p><ul>' + data.ESSENTIALS.map(e=>`<li><b>${e[0]}.</b> ${e[1]}</li>`).join('') + '</ul>';
data.ARTICLES['phone-smart'].body = '<p>A phone is valuable, but it is not enough preparation by itself.</p><ul>'+data.PHONE_CHECKLIST.map(x=>`<li>${x}</li>`).join('')+'</ul>';
fs.writeFileSync('/private/tmp/trailsafe-content-raw.json', JSON.stringify(data));

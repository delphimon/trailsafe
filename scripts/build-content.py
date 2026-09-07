"""Convert reference HTML into bundled native-renderable content blocks."""
import json, re
from html.parser import HTMLParser
from pathlib import Path
class Node:
    def __init__(self, tag='', attrs=()): self.tag=tag; self.attrs=dict(attrs); self.children=[]
    def text(self): return ''.join(x.text() if isinstance(x,Node) else x for x in self.children)
class Parser(HTMLParser):
    def __init__(self, text):
        super().__init__(); self.root=Node(); self.stack=[self.root]; self.feed(text)
    def handle_starttag(self, tag, attrs):
        n=Node(tag,attrs); self.stack[-1].children.append(n)
        if tag not in ['br','input','meta','link','img','hr']: self.stack.append(n)
    def handle_endtag(self, tag):
        for i in range(len(self.stack)-1,0,-1):
            if self.stack[i].tag == tag: self.stack=self.stack[:i]; break
    def handle_data(self,data): self.stack[-1].children.append(data)
def clean(t): return re.sub(r'\s+',' ',t).strip()
def blocks(node):
    out=[]
    for n in node.children:
        if not isinstance(n,Node): continue
        c=n.attrs.get('class','')
        if n.tag=='svg': continue
        if 'mini-e-bar' in c: continue
        if n.tag in ['ul','ol']:
            out.append(dict(type='steps' if n.tag=='ol' else 'list',items=[clean(x.text()) for x in n.children if isinstance(x,Node) and x.tag=='li']))
        elif 'callout' in c:
            title=next((clean(x.text()) for x in n.children if isinstance(x,Node) and x.tag=='strong'),'')
            text=clean(n.text()); text=text[len(title):].strip() if title else text
            out.append(dict(type='callout',title=title,text=text,critical='critical' in c))
        elif n.tag=='p': out.append(dict(type='heading' if 'kicker' in c or 'card-title' in c else 'note' if 'hint' in c else 'paragraph',text=clean(n.text())))
        elif n.tag=='a': out.append(dict(type='link',text=clean(n.text()),url=n.attrs.get('href','')))
        else: out.extend(blocks(n))
    return out
raw=json.loads(Path('/private/tmp/trailsafe-content-raw.json').read_text())
articles={k:dict(title=v['title'],subtitle=v.get('sub',''),blocks=blocks(Parser(v['body']).root)) for k,v in raw['ARTICLES'].items()}
root=Parser(Path('docs/reference/kcesar-trailsafe.html').read_text()).root
meta={'g-lost':('Lost / Off Route','Stop. Think. Observe. Plan.'),'g-injured':('Injured or Sick',''),'g-stranded':("Can’t Continue",''),'g-party-missing':('Party Member Missing',''),'g-overdue':('Overdue Person',''),'g-other':('Other Emergency',''),'g-waiting':('Waiting for Rescue','')}
def walk(n):
    if not isinstance(n,Node): return
    key=n.attrs.get('data-screen','')
    if key in meta: articles[key]=dict(title=meta[key][0],subtitle=meta[key][1],blocks=blocks(n))
    for x in n.children: walk(x)
walk(root)
# Preserve the prototype while correcting contradictory or misleading safety copy.
for article in articles.values():
    for block in article['blocks']:
        for key in ['text','title']:
            if key in block: block[key]=block[key].replace('Emergency → Get Location','Emergency → Your Location')
articles['heat']['blocks']=[
 dict(type='paragraph',text='Heat problems can become serious quickly, especially on exposed trail. Stop exertion and get out of the heat.'),
 dict(type='heading',text='Heat exhaustion'),
 dict(type='list',items=['Heavy sweating, dizziness, headache, nausea, and weakness can be warning signs.','Move to shade, loosen excess clothing, and cool the skin with water and wet cloths.','Sip water only if fully alert and able to swallow. Seek medical help if vomiting, worsening, or symptoms persist.']),
 dict(type='callout',title='Possible heat stroke — call 911',text='Confusion, slurred speech, collapse, or a very high body temperature is an emergency. The person may still be sweating. Call 911 and begin cooling immediately; follow dispatcher instructions. Do not give fluids to someone who is confused or unconscious.',critical=True)]
for b in articles['cold-hypothermia']['blocks']:
    if 'items' in b: b['items']=[x.replace('Keep them awake and gently moving if they safely can be.','Handle the person gently. Do not make a confused or severely cold person walk.') for x in b['items']]
for b in articles['backcountry-radio']['blocks']:
    if 'text' in b: b['text']=b['text'].replace('ham radio and some SAR-monitored repeaters can extend range significantly','ham radio and repeaters can sometimes extend range').replace('but this requires training and licensing this app doesn’t provide.','but this requires training and licensing this app doesn’t provide. Do not assume any channel or repeater is monitored by SAR.')
for b in articles['lessons-learned']['blocks']:
    if 'text' in b and 'one bar' in b['text'].lower(): b['text']='A hiker could see a signal indicator but could not complete a call. Lesson: try texting if a call cannot connect. Do not roam or enter hazardous terrain for reception. If in contact with 911, stay where responders expect you unless staying is immediately unsafe.'
articles['unexpected-overnight']['blocks'].append(dict(type='callout',title='If you cannot safely self-rescue',text='Call 911 early. An overnight message does not cancel an active rescue. Follow dispatcher instructions and stay where rescuers expect you.',critical=True))
# Avoid reproducing the prototype’s incorrect X = cannot continue signal diagram.
articles['signaling']['blocks']=[b for b in articles['signaling']['blocks'] if b.get('text')!='Ground-to-air signals']
for b in articles['signaling']['blocks']:
    if 'items' in b: b['items']=[x.replace('Three of anything is a recognized distress signal — three whistle blasts, three fires, three flashes.','Use repeated whistle blasts or a light to attract attention. Never start a signal fire where it could create a wildfire or another hazard.') for x in b['items']]
common=['https://kingcountysar.org/wilderness-safety/','https://kingcountysar.org/when-how-to-call-for-help/']
for key,a in articles.items():
    a.update(id=key,contentVersion='2026.09.06',reviewStatus='Draft — organizational review pending',sources=common.copy())
    if key in ['heat','cold-hypothermia']: a['sources'].append('https://www.cdc.gov/niosh/heat-stress/about/illnesses.html' if key=='heat' else 'https://www.cdc.gov/winter-weather/prevention/index.html')
    if key in ['calling-help','g-overdue','g-other']: a['sources'].append('https://kingcounty.gov/en/dept/kcit/data-information-services/911-program-office/911-the-basics')
raw['ARTICLES']=articles
raw['GUIDE_TOPICS']=[t for t in raw['GUIDE_TOPICS'] if t['kind']!='soon']
# This checklist intentionally follows the prototype’s ten systems; food is an explicit extra prompt.
Path('src/content/library.json').write_text(json.dumps(raw,ensure_ascii=False,indent=2)+'\n')
print(f'Extracted {len(articles)} articles and {len(raw["RESOURCES"])} resources.')

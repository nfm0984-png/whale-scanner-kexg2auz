#!/usr/bin/env python3
"""Turn page_embed.json into the compact page_data_line.txt the canvas embeds (columnar rows for buys/bets/traders)."""
import json, os
HERE = os.path.dirname(os.path.abspath(__file__))
d = json.load(open(os.path.join(HERE, 'page_embed.json')))
def r3(x): return round(x, 3) if isinstance(x, float) else x
def kk(k): return [k.get('action'), k.get('price'), k.get('contract'), k.get('edge_vs_whales'), k.get('why')]
BF = ['ts','firstTs','fills','wallet','name','wr','wpnl','top100','rank','golden','q','side','label','kind','league','price','now','usd','shares','posCost','hedged','agree60','agreeAll','score','parts','kAct','kPrice','kContract','kEdge','kWhy','start','src','startTs','phase','gDetail','gScore','rank30','rankAll']
buys = []
for b in d['buys']:
    g = b['game']
    buys.append([b['ts'],b['firstTs'],b['fills'],b['wallet'],b['name'],b['wr'],b['wpnl'],b['top100'],b['rank'],b['golden'],b['q'],b['side'],b['label'],b['kind'],b['league'],r3(b['price']),r3(b['now']),b['usd'],b['shares'],b['posCost'],b['hedged'],b['agree60'],b['agreeAll'],b['score'],list(b['parts'].values())]+kk(b['kalshi'])+[g.get('start'),g.get('src'),b['startTs'],b['phase'],g.get('detail') or '',g.get('score') or '',b.get('rank30'),b.get('rankAll')])
TF = ['ts','firstTs','lastBuyTs','wallet','name','wr','resolved','cpnl','rank','golden','skill','top100','src','q','side','label','outcome','kind','league','shares','avg','now','cost','value','upnl','upct','consYes','consNo','agree60','agreeAll','score','parts','kAct','kPrice','kContract','kEdge','kWhy','start','src2','startTs','phase','gDetail','gScore','rank30','rankAll']
bets = []
for b in d['bets']:
    g = b['game']; c = b.get('cons') or {}
    bets.append([None,b['firstTs'],b.get('lastBuyTs'),b['wallet'],b['name'],b['wr'],b['resolved'],b['cpnl'],b['rank'],b['golden'],b['skill'],bool(b.get('top100')),b.get('src'),b['q'],b['side'],b['label'],b['outcome'],b['kind'],b['league'],b['shares'],r3(b['avg']),r3(b['now']),b['cost'],b['value'],b['upnl'],b['upct'],c.get('yes'),c.get('no'),b['agree60'],b['agreeAll'],b['score'],list(b['parts'].values())]+kk(b['kalshi'])+[g.get('start'),g.get('src'),b['startTs'],b['phase'],g.get('detail') or '',g.get('score') or '',b.get('rank30'),b.get('rankAll')])
RF = ['wallet','name','rank','pnl','wr','resolved','wins','losses','pf','skill','golden','qualified','bets','value','lastTs','skillEdge','rank30','sportsPct','rankAll','pnl30']
tr = [[t.get(f) if not isinstance(t.get(f), float) else round(t[f], 2) for f in RF] for t in d['traders']]
d['buysC'] = {'f': BF, 'r': buys}; d['betsC'] = {'f': TF, 'r': bets}; d['tradersC'] = {'f': RF, 'r': tr}
d['partNames'] = list((d['buys'] or d['bets'] or [{'parts': {}}])[0]['parts'].keys())
del d['buys'], d['bets'], d['traders']
for s in d['signals'] + d['fun'] + (d.get('poly') or []) + (d.get('glue') or []): s['kalshi'].pop('url', None); s['kalshi'].pop('occ', None)
line = 'const DATA: ScanData = ' + json.dumps(d, separators=(',', ':'), ensure_ascii=False) + ';'
open(os.path.join(HERE, 'page_data_line.txt'), 'w').write(line)
json.dump(d, open(os.path.join(HERE, '..', 'data.json'), 'w'), separators=(',', ':'), ensure_ascii=False)
print('page_data_line.txt', len(line), 'bytes')

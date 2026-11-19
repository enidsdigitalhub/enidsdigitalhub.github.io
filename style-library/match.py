from styles_data import CORE, AXES
from questions import QUESTIONS
import math, random, collections
W_TAG = 0.75
def scores(choices):
    acc={a:[] for a in AXES}; votes=collections.Counter(); n=0
    for qi,k in enumerate(choices):
        if k is None: continue
        o=QUESTIONS[qi]['o'][k]; n+=1
        for a,v in o['v'].items(): acc[a].append(v)
        for t in o['tags']: votes[t]+=1/math.sqrt(len(o['tags']))
    u={a:sum(l)/len(l) for a,l in acc.items() if l}
    out={}
    for s in CORE:
        d=math.sqrt(sum((u[a]-s['profile'][a])**2 for a in u)/max(len(u),1))
        sim=max(0,1-d/0.5); tag=votes[s['id']]/max(n,1)
        out[s['id']]=W_TAG*tag+(1-W_TAG)*sim
    return out
def rank(ch): s=scores(ch); return sorted(s, key=lambda k:-s[k])
if __name__=='__main__':
    bad=0
    for s in CORE:
        # best answer set for this style: greedy per question then local improve
        ch=[0]*len(QUESTIONS)
        for it in range(3):
            for qi in range(len(QUESTIONS)):
                best=max(range(4), key=lambda k: (lambda c: (lambda sc: sc[s['id']]-max(v for kk,v in sc.items() if kk!=s['id']))(scores(c)))(ch[:qi]+[k]+ch[qi+1:]))
                ch[qi]=best
        r=rank(ch); ok=r[0]==s['id']; bad+=not ok
        print(('OK ' if ok else 'XX ')+s['id'].ljust(20), r[:3])
    c=collections.Counter(rank([random.randrange(4) for _ in QUESTIONS])[0] for _ in range(20000))
    print(bad,'unreachable'); print(sorted(c.items(), key=lambda x:-x[1]))

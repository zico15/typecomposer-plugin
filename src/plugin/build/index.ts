// import { readFileSync, writeFileSync } from 'node:fs';
import { readFileSync, writeFileSync } from 'node:fs'
import type { Plugin, ResolvedConfig } from 'vite'
import { ProjectBuild } from '../base/ProjectBuild'
import { StyleBuild } from '../base/Style'


const safariPolyfill = 'if (/^((?!chrome|android).)*safari/i.test(navigator.userAgent)) {const{keys:e}=Object,t=!0,r=!1,n="querySelectorAll",o="querySelectorAll",{document:l,Element:s,MutationObserver:a,Set:c,WeakMap:u}=self,i=e=>o in e,{filter:d}=[];var h=e=>{const h=new u,f=(t,r)=>{let n;if(r)for(let o,l=(e=>e.matches||e.webkitMatchesSelector||e.msMatchesSelector)(t),s=0,{length:a}=p;s<a;s++)l.call(t,o=p[s])&&(h.has(t)||h.set(t,new c),n=h.get(t),n.has(o)||(n.add(o),e.handle(t,r,o)));else h.has(t)&&(n=h.get(t),h.delete(t),n.forEach((n=>{e.handle(t,r,n)})))},g=(e,t=!0)=>{for(let r=0,{length:n}=e;r<n;r++)f(e[r],t)},{query:p}=e,b=e.root||l,y=((e,o=document,l=MutationObserver,s=["*"])=>{const a=(r,o,l,s,c,u)=>{for(const i of r)(u||n in i)&&(c?l.has(i)||(l.add(i),s.delete(i),e(i,c)):s.has(i)||(s.add(i),l.delete(i),e(i,c)),u||a(i[n](o),o,l,s,c,t))},c=new l((e=>{if(s.length){const n=s.join(","),o=new Set,l=new Set;for(const{addedNodes:s,removedNodes:c}of e)a(c,n,o,l,r,r),a(s,n,o,l,t,r)}})),{observe:u}=c;return(c.observe=e=>u.call(c,e,{subtree:t,childList:t}))(o),c})(f,b,a,p),{attachShadow:w}=s.prototype;return w&&(s.prototype.attachShadow=function(e){const t=w.call(this,e);return y.observe(t),t}),p.length&&g(b[o](p)),{drop:e=>{for(let t=0,{length:r}=e;t<r;t++)h.delete(e[t])},flush:()=>{const e=y.takeRecords();for(let t=0,{length:r}=e;t<r;t++)g(d.call(e[t].removedNodes,i),!1),g(d.call(e[t].addedNodes,i),!0)},observer:y,parse:g}};const{customElements:f,document:g,Element:p,MutationObserver:b,Object:y,Promise:w,Map:m,Set:S,WeakMap:v,Reflect:A}=self,{createElement:E}=g,{define:M,get:O,upgrade:q}=f,{construct:k}=A||{construct(e){return e.call(this)}},{defineProperty:N,getOwnPropertyNames:$,setPrototypeOf:P}=y,C=new v,j=new S,V=new m,L=new m,R=new m,T=new m,W=[],_=[],x=e=>T.get(e)||O.call(f,e),{parse:D}=h({query:_,handle:(t,r,n)=>{const o=R.get(n);if(r&&!o.isPrototypeOf(t)){const r=(t=>{const r=e(t),n=[],o=new Set,{length:l}=r;for(let e=0;e<l;e++){n[e]=t[r[e]];try{delete t[r[e]]}catch(t){o.add(e)}}return()=>{for(let e=0;e<l;e++)o.has(e)||(t[r[e]]=n[e])}})(t);B=P(t,o);try{new o.constructor}finally{B=null,r()}}const l=(r?"":"dis")+"connectedCallback";l in o&&t[l]()}}),{parse:F}=h({query:W,handle(e,t){C.has(e)&&(t?j.add(e):j.delete(e),_.length&&G.call(_,e))}}),{attachShadow:H}=p.prototype;H&&(p.prototype.attachShadow=function(e){const t=H.call(this,e);return C.set(this,t),t});const I=e=>{if(!L.has(e)){let t,r=new w((e=>{t=e}));L.set(e,{$:r,_:t})}return L.get(e).$},z=((e,t)=>{const r=e=>{for(let t=0,{length:r}=e;t<r;t++)n(e[t])},n=({target:e,attributeName:t,oldValue:r})=>{e.attributeChangedCallback(t,r,e.getAttribute(t))};return(o,l)=>{const{observedAttributes:s}=o.constructor;return s&&e(l).then((()=>{new t(r).observe(o,{attributes:!0,attributeOldValue:!0,attributeFilter:s});for(let e=0,{length:t}=s;e<t;e++)o.hasAttribute(s[e])&&n({target:o,attributeName:s[e],oldValue:null})})),o}})(I,b);let B=null;function G(e){const t=C.get(e);D(t.querySelectorAll(this),e.isConnected)}$(self).filter((e=>/^HTML.*Element$/.test(e))).forEach((e=>{const t=self[e];function r(){const{constructor:e}=this;if(!V.has(e))throw new TypeError("Illegal constructor");const{is:r,tag:n}=V.get(e);if(r){if(B)return z(B,r);const t=E.call(g,n);return t.setAttribute("is",r),z(P(t,e.prototype),r)}return k.call(this,t,[],e)}P(r,t),N(r.prototype=t.prototype,"constructor",{value:r}),N(self,e,{value:r})})),g.createElement=function(e,t){const r=t&&t.is;if(r){const t=T.get(r);if(t&&V.get(t).tag===e)return new t}const n=E.call(g,e);return r&&n.setAttribute("is",r),n},f.get=x,f.whenDefined=I,f.upgrade=function(e){const t=e.getAttribute("is");if(t){const r=T.get(t);if(r)return void z(P(e,r.prototype),t)}q.call(f,e)},f.define=function(e,t,r){if(x(e))throw new Error(`\'${e}\' has already been defined as a custom element`);let n;const o=r&&r.extends;V.set(t,o?{is:e,tag:o}:{is:"",tag:e}),o?(n=`${o}[is="${e}"]`,R.set(n,t.prototype),T.set(e,t),_.push(n)):(M.apply(f,arguments),W.push(n=e)),I(e).then((()=>{o?(D(g.querySelectorAll(n)),j.forEach(G,[n])):F(g.querySelectorAll(n))})),L.get(e)._(t)};}'

export function BuildPlugin(project: ProjectBuild): Plugin {
    let config: ResolvedConfig | undefined = undefined
    let indexjs: string | undefined = undefined

    return {
        name: 'typecompose:pwa',
        enforce: 'pre',
        apply: 'build',
        transformIndexHtml: {
            order: 'post',
            handler(html) {
                const regex = /<script\s+type="module"\s+src="\/node_modules\/typecompose-plugin\/public\/safari-polyfill\.ts"[^>]*><\/script>/g;

                html = html.replace(regex, '');
                // console.log('BuildPlugin: transformIndexHtml: ', html)
                return html

            },
            enforce: 'pre', // deprecated since Vite 4
            async transform(html) { // deprecated since Vite 4
                // console.log('BuildPlugin: transformIndexHtml: ', html)
            },
        },
        configResolved(_config) {
            config = _config

        },
        async generateBundle(n, bundle) {
            for (const [fileName, asset] of Object.entries(bundle)) {
                if (asset.type == 'chunk')
                    indexjs = fileName
                // else if (fileName.endsWith('.css')) {
                //     asset.source = asset.source + await StyleBuild.getStyleCodeAll(project)
                //     console.log('BuildPlugin: generateBundle: ', fileName)
                // }
            }
        },
        resolveId(id, importer) {
            // console.log('BuildPlugin: resolveId: ', id, " importer: ", importer)
            // if (id.includes(StyleBuild.identifier)) {
            //     const fileInfo = Array.from(project.files.values()).find(e => e.virtualFile && id.includes(e.virtualFile));
            //     console.log('BuildPlugin: resolveId: ', id, " fileInfo: ", fileInfo)

            //     if (fileInfo) {
            //         return {
            //             id: id,
            //             external: true,
            //             context: fileInfo.styleCode,
            //             moduleSideEffects: false,
            //         };
            //     }
            // }
            return null
        },
        async transform(code, id, options) {
            if (id.includes("typecompose/styles/style.scss")) {
                const styleCode = code + await StyleBuild.getStyleCodeAll(project);

                // console.log('BuildPlugin: transform: ', id, " styleCode: ", styleCode)
                return styleCode;
            }
            return null
        },
        closeBundle: {
            sequential: true,
            order: 'post',
            async handler() {
                console.log('BuildPlugin: closeBundle')
                if (indexjs && config) {
                    const file = `${config.build.outDir}/${indexjs}`
                    let code = readFileSync(file, 'utf-8')
                    code = safariPolyfill + code;
                    writeFileSync(file, code);
                }
                // if (config) {
                //     const file = `${config.build.outDir}/index.html`
                //     let code = readFileSync(file, 'utf-8')
                //     const regex = /<script\s+type="module"\s+src="\/node_modules\/typecompose-plugin\/public\/safari-polyfill\.ts"><\/script>/g;
                //     writeFileSync(file, code.replace(regex, ''));
                // }
            },
        },
        async buildEnd(error) {
            if (error)
                throw error
        },
    }
}
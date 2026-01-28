<template>
  <Html lang="en">
    <Body class="min-h-screen bg-slate-50">
      <transition name="page-loader">
        <div
          v-if="isNavigating"
          class="fixed inset-0 z-50 flex items-center justify-center bg-white/70 px-6 py-10 backdrop-blur-sm"
        >
          <div class="w-full max-w-md rounded-3xl border border-sky-100 bg-white p-6 shadow-xl">
            <div class="flex items-center gap-4">
              <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50">
                <div class="flex items-center gap-1">
                  <span class="page-loader-dot h-2 w-2 rounded-full bg-sky-500"></span>
                  <span class="page-loader-dot h-2 w-2 rounded-full bg-emerald-500"></span>
                  <span class="page-loader-dot h-2 w-2 rounded-full bg-amber-500"></span>
                </div>
              </div>
              <div>
                <p class="text-sm font-semibold text-slate-900">Loading next page</p>
                <p class="mt-1 text-sm text-slate-600">
                  Fetching the latest demo catalog data. Thanks for your patience.
                </p>
              </div>
            </div>
            <div class="mt-6 h-1 w-full overflow-hidden rounded-full bg-slate-100">
              <div class="page-loader-bar h-full w-1/2 bg-gradient-to-r from-sky-400 via-emerald-400 to-amber-400"></div>
            </div>
          </div>
        </div>
      </transition>
      <NuxtLayout>
        <NuxtPage />
      </NuxtLayout>
      <UINotifications />
    </Body>
  </Html>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

const appConfig = useRuntimeConfig()
const isNavigating = ref(false)
const vwoScript = `window._vwo_code ||
(function () {
var w=window,
d=document;
var account_id=1146221,
version=2.2,
settings_tolerance=2000,
hide_element='body',
hide_element_style = 'opacity:0 !important;filter:alpha(opacity=0) !important;background:none !important';
/* DO NOT EDIT BELOW THIS LINE */
if(f=!1,v=d.querySelector('#vwoCode'),cc={},-1<d.URL.indexOf('__vwo_disable__')||w._vwo_code)return;try{var e=JSON.parse(localStorage.getItem('_vwo_'+account_id+'_config'));cc=e&&'object'==typeof e?e:{}}catch(e){}function r(t){try{return decodeURIComponent(t)}catch(e){return t}}var s=function(){var e={combination:[],combinationChoose:[],split:[],exclude:[],uuid:null,consent:null,optOut:null},t=d.cookie||'';if(!t)return e;for(var n,i,o=/(?:^|;\\s*)(?:(_vis_opt_exp_(\\d+)_combi=([^;]*))|(_vis_opt_exp_(\\d+)_combi_choose=([^;]*))|(_vis_opt_exp_(\\d+)_split=([^:;]*))|(_vis_opt_exp_(\\d+)_exclude=[^;]*)|(_vis_opt_out=([^;]*))|(_vwo_global_opt_out=[^;]*)|(_vwo_uuid=([^;]*))|(_vwo_consent=([^;]*)))/g;null!==(n=o.exec(t));)try{n[1]?e.combination.push({id:n[2],value:r(n[3])}):n[4]?e.combinationChoose.push({id:n[5],value:r(n[6])}):n[7]?e.split.push({id:n[8],value:r(n[9])}):n[10]?e.exclude.push({id:n[11]}):n[12]?e.optOut=r(n[13]):n[14]?e.optOut=!0:n[15]?e.uuid=r(n[16]):n[17]&&(i=r(n[18]),e.consent=i&&3<=i.length?i.substring(0,3):null)}catch(e){}return e}();function i(){var e=function(){if(w.VWO&&Array.isArray(w.VWO))for(var e=0;e<w.VWO.length;e++){var t=w.VWO[e];if(Array.isArray(t)&&('setVisitorId'===t[0]||'setSessionId'===t[0]))return!0}return!1}(),t='a='+account_id+'&u='+encodeURIComponent(w._vis_opt_url||d.URL)+'&vn='+version+'&ph=1'+('undefined'!=typeof platform?'&p='+platform:'')+'&st='+w.performance.now();e||((n=function(){var e,t=[],n={},i=w.VWO&&w.VWO.appliedCampaigns||{};for(e in i){var o=i[e]&&i[e].v;o&&(t.push(e+'-'+o+'-1'),n[e]=!0)}if(s&&s.combination)for(var r=0;r<s.combination.length;r++){var a=s.combination[r];n[a.id]||t.push(a.id+'-'+a.value)}return t.join('|')}())&&(t+='&c='+n),(n=function(){var e=[],t={};if(s&&s.combinationChoose)for(var n=0;n<s.combinationChoose.length;n++){var i=s.combinationChoose[n];e.push(i.id+'-'+i.value),t[i.id]=!0}if(s&&s.split)for(var o=0;o<s.split.length;o++)t[(i=s.split[o]).id]||e.push(i.id+'-'+i.value);return e.join('|')}())&&(t+='&cc='+n),(n=function(){var e={},t=[];if(w.VWO&&Array.isArray(w.VWO))for(var n=0;n<w.VWO.length;n++){var i=w.VWO[n];if(Array.isArray(i)&&'setVariation'===i[0]&&i[1]&&Array.isArray(i[1]))for(var o=0;o<i[1].length;o++){var r,a=i[1][o];a&&'object'==typeof a&&(r=a.e,a=a.v,r&&a&&(e[r]=a))}}for(r in e)t.push(r+'-'+e[r]);return t.join('|')}())&&(t+='&sv='+n)),s&&s.optOut&&(t+='&o='+s.optOut);var n=function(){var e=[],t={};if(s&&s.exclude)for(var n=0;n<s.exclude.length;n++){var i=s.exclude[n];t[i.id]||(e.push(i.id),t[i.id]=!0)}return e.join('|')}();return n&&(t+='&e='+n),s&&s.uuid&&(t+='&id='+s.uuid),s&&s.consent&&(t+='&consent='+s.consent),w.name&&-1<w.name.indexOf('_vis_preview')&&(t+='&pM=true'),w.VWO&&w.VWO.ed&&(t+='&ed='+w.VWO.ed),t}code={nonce:v&&v.nonce,library_tolerance:function(){return'undefined'!=typeof library_tolerance?library_tolerance:void 0},settings_tolerance:function(){return cc.sT||settings_tolerance},hide_element_style:function(){return'{'+(cc.hES||hide_element_style)+'}'},hide_element:function(){return performance.getEntriesByName('first-contentful-paint')[0]?'':'string'==typeof cc.hE?cc.hE:hide_element},getVersion:function(){return version},finish:function(e){var t;f||(f=!0,(t=d.getElementById('_vis_opt_path_hides'))&&t.parentNode.removeChild(t),e&&((new Image).src='https://dev.visualwebsiteoptimizer.com/ee.gif?a='+account_id+e))},finished:function(){return f},addScript:function(e){var t=d.createElement('script');t.type='text/javascript',e.src?t.src=e.src:t.text=e.text,v&&t.setAttribute('nonce',v.nonce),d.getElementsByTagName('head')[0].appendChild(t)},load:function(e,t){t=t||{};var n=new XMLHttpRequest;n.open('GET',e,!0),n.withCredentials=!t.dSC,n.responseType=t.responseType||'text',n.onload=function(){if(t.onloadCb)return t.onloadCb(n,e);200===n.status?_vwo_code.addScript({text:n.responseText}):_vwo_code.finish('&e=loading_failure:'+e)},n.onerror=function(){if(t.onerrorCb)return t.onerrorCb(e);_vwo_code.finish('&e=loading_failure:'+e)},n.send()},init:function(){var e,t=this.settings_tolerance();w._vwo_settings_timer=setTimeout(function(){_vwo_code.finish()},t),'body'!==this.hide_element()?(n=d.createElement('style'),e=(t=this.hide_element())?t+this.hide_element_style():'',t=d.getElementsByTagName('head')[0],n.setAttribute('id','_vis_opt_path_hides'),v&&n.setAttribute('nonce',v.nonce),n.setAttribute('type','text/css'),n.styleSheet?n.styleSheet.cssText=e:n.appendChild(d.createTextNode(e)),t.appendChild(n)):(n=d.getElementsByTagName('head')[0],(e=d.createElement('div')).style.cssText='z-index: 2147483647 !important;position: fixed !important;left: 0 !important;top: 0 !important;width: 100% !important;height: 100% !important;background: white !important;',e.setAttribute('id','_vis_opt_path_hides'),e.classList.add('_vis_hide_layer'),n.parentNode.insertBefore(e,n.nextSibling));var n='https://dev.visualwebsiteoptimizer.com/j.php?'+i();-1!==w.location.search.indexOf('_vwo_xhr')?this.addScript({src:n}):this.load(n+'&x=true',{l:1})}};w._vwo_code=code;code.init();})();`

onMounted(() => {
  const router = useRouter()
  const stopBefore = router.beforeEach((to, from, next) => {
    if (to.fullPath !== from.fullPath) {
      isNavigating.value = true
    }
    next()
  })
  const stopAfter = router.afterEach(() => {
    isNavigating.value = false
  })
  const stopError = router.onError(() => {
    isNavigating.value = false
  })

  onBeforeUnmount(() => {
    stopBefore()
    stopAfter()
    stopError()
  })
})

useHead({
  bodyAttrs: {
    class: 'antialiased font-sans'
  },
  meta: [
    {
      name: 'keywords',
      content: `nuxt, ecommerce, ${appConfig.public.companyName}`
    }
  ],
  script: [
    {
      id: 'vwoCode',
      type: 'text/javascript',
      innerHTML: vwoScript
    }
  ],
  __dangerouslyDisableSanitizersByTagID: {
    vwoCode: ['innerHTML']
  }
} as any)
</script>

<style scoped>
.page-loader-enter-active,
.page-loader-leave-active {
  transition: opacity 200ms ease;
}

.page-loader-enter-from,
.page-loader-leave-to {
  opacity: 0;
}

.page-loader-dot {
  animation: page-loader-bounce 1.2s ease-in-out infinite;
}

.page-loader-dot:nth-child(2) {
  animation-delay: 0.2s;
}

.page-loader-dot:nth-child(3) {
  animation-delay: 0.4s;
}

.page-loader-bar {
  animation: page-loader-bar 1.6s ease-in-out infinite;
}

@keyframes page-loader-bounce {
  0%,
  80%,
  100% {
    transform: translateY(0);
    opacity: 0.6;
  }
  40% {
    transform: translateY(-4px);
    opacity: 1;
  }
}

@keyframes page-loader-bar {
  0% {
    transform: translateX(-60%);
  }
  100% {
    transform: translateX(120%);
  }
}
</style>

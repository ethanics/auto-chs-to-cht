// ==UserScript==
// @name         Auto CHS→CHT (Taiwan)
// @name:zh-TW   自動正體中文化
// @version      1.0.13
// @description  Automatically detects Simplified Chinese pages and converts to Traditional Chinese (Taiwan) using opencc-js s2twp.
// @description:zh-TW  自動偵測簡體中文網頁，使用 opencc-js s2twp 轉換為正體中文。
// @author       ethanics
// @match        *://*/*
// @grant        unsafeWindow
// @require      https://cdn.jsdelivr.net/npm/opencc-js@1.4.1/dist/umd/full.js
// @downloadURL  https://raw.githubusercontent.com/ethanics/auto-chs-to-cht/refs/heads/main/auto-chs-to-cht.user.js
// @updateURL    https://raw.githubusercontent.com/ethanics/auto-chs-to-cht/refs/heads/main/auto-chs-to-cht.user.js
// @run-at       document-end
// ==/UserScript==

(function () {
  'use strict';

  function getOpenCC() {
    if (
      typeof OpenCC !== 'undefined' &&
      OpenCC &&
      typeof OpenCC.Converter === 'function'
    ) {
      return OpenCC;
    }

    const pageWindow = typeof unsafeWindow !== 'undefined' ? unsafeWindow : window;
    const pageOpenCC = pageWindow ? pageWindow.OpenCC : null;
    if (pageOpenCC && typeof pageOpenCC.Converter === 'function') {
      return pageOpenCC;
    }

    return null;
  }

  let converter = null;

  function detectLang(langStr) {
    if (!langStr || typeof langStr !== 'string') {
      return null;
    }
    const lang = langStr.trim().toLowerCase();
    if (lang === '') {
      return null;
    }

    if (lang === 'ja' || lang.startsWith('ja-')) {
      return false;
    }

    return null;
  }

  function checkStep1Lang() {
    const htmlLang = document.documentElement ? document.documentElement.lang : '';
    const htmlResult = detectLang(htmlLang);
    if (htmlResult !== null) {
      return htmlResult;
    }

    const metaTag = document.querySelector('meta[http-equiv="Content-Language"], meta[http-equiv="content-language"]');
    if (metaTag && metaTag.content) {
      const metaResult = detectLang(metaTag.content);
      if (metaResult !== null) {
        return metaResult;
      }
    }

    return null;
  }

  const cjkRegex = /[\u4e00-\u9fff]/;
  // High-frequency simplified-only character set for early-bailout filtering
  const simpCharRegex = /[㐷㐹㐽㑇㑈㑔㑩㓥㓰㔉㖊㖞㘎㚯㛀㛣㛤㟆㟥㡎㤘㤽㥪㧏㧐㧑㧟㧰㨫㭎㭏㭤㭴㱩㱮㲿㳔㳕㳠㳡㳽㴋㶉㶶㶽㺍㻅䀥䁖䂵䃅䅉䅟䇲䉤䌶䌷䌸䌹䌺䌻䌼䌽䌾䌿䍀䍁䍠䎬䏝䓓䓕䓖䓨䗖䙌䙓䜣䜤䜧䜩䝙䞍䞐䟢䥺䥽䥾䦂䦃䦅䦆䦶䦷䩄䯄䯅䲝䲟䲠䲡䲢䲣䴓䴔䴕䴖䴗䴘䴙䶮万与专业丛东丝丢两严丧个临为丽举义乌乐乔习乡书买乱争亏亘亚产亩亲亵亸亿仅从仑仓仪们价众优会伛伞伟传伡伣伤伥伦伧伪伫体佥侠侣侥侦侧侨侩侪侬侭俣俦俨俩俪俫俭债倾偬偻偾偿傤傥傧储傩兑兖党兰关兴兹养兽冁内冈册写军农冯冲决况冻净凄凉减凑凛凤凫凭凯击凿刍刘则刚创删别刬刭刹刽刾刿剀剂剐剑剥剧劝办务劢动励劲劳势勋勚匀匦匮区医华协单卖卢卤卧卫却卺厂厅历厉压厌厍厐厕厢厣厦厨厩厮县叁参叆叇双发变叙叠号叶叹叽吓吕吗吨听启吴呐呒呓呕呖呗员呙呛呜咏咙咛咝咤响哑哒哓哔哕哗哙哜哝哟唛唝唠唡唢唤啧啬啭啮啯啰啴啸喷喽喾嗫嗳嘘嘤嘱噜嚣团园囱围囵国图圆圣圹场坏块坚坛坜坝坞坟坠垄垅垆垒垦垩垫垭垯垱垲垴埘埙埚堑堕塆墙壮声壳壶壸处备复够头夹夺奁奂奋奖奥妆妇妈妩妪妫姗姹娄娅娆娇娈娱娲娴婳婴婵婶媪媭嫒嫔嫱嬷孙学孪宁宝实宠审宪宫宽宾寝对寻导寿将尔尘尝尧尴尽层屃屉届属屡屦屿岁岂岖岗岘岚岛岭岽岿峃峄峡峣峤峥峦崂崃崄崭嵘嵚嵝巅巩巯币帅师帏帐帘帜带帧帮帱帻帼幂并广庆庐庑库应庙庞废庼廪开异弃弑张弥弪弯弹强归当录彟彦彨彻径徕忆忏忧忾怀态怂怃怄怅怆怜总怼怿恋恒恳恶恸恹恺恻恼恽悦悫悬悭悮悯惊惧惨惩惫惬惭惮惯愠愤愦慑慭懑懒懔戆戋戏戗战戬戯户扑执扩扪扫扬扰抚抛抟抠抡抢护报担拟拢拣拥拦拧拨择挂挚挛挜挝挞挟挠挡挢挣挤挥挦捝捞损捡换捣据掳掴掷掸掺掼揽揾揿搀搁搂搄搅携摄摅摆摇摈摊撄撑撵撷撸撺擜擞攒敌敚敛敩数斋斓斩断无旧时旷旸昙昵昼昽显晋晒晓晔晕晖暂暧术机杀杂权杠条来杨杩极构枞枢枣枥枧枨枪枫枭柜柠柽栀栅标栈栉栊栋栌栎栏树栖样栾桠桡桢档桤桥桦桧桨桩桪梦梼梾梿检棁棂椁椝椟椠椢椤椫椭椮楼榄榅榇榈榉榝槚槛槟槠横樯樱橥橱橹橼檩欢欤欧歼殁殇残殒殓殚殡殴毁毂毕毙毡毵氇氢氩氲汇汉汤汹沄沟没沣沤沥沦沧沨沩沪泞泪泶泷泸泺泻泼泽泾洁洒洼浃浅浆浇浈浉浊测浍济浏浐浑浒浓浔浕涌涚涛涝涞涟涠涡涢涣涤润涧涨涩淀渊渌渍渎渐渑渔渖渗温湾湿溁溃溅溆溇滗滚滞滟滠满滢滤滥滦滨滩滪潆潇潋潍潜潴澛澜濑濒灏灭灯灵灾灿炀炉炖炜炝点炼炽烁烂烃烛烟烦烧烨烩烫烬热焕焖焘煴爱爷牍牦牵牺犊状犷犸犹狈狝狞独狭狮狯狰狱狲猃猎猕猡猪猫猬献獭玑玙玚玛玮环现玱玺珐珑珰珲琎琏琐琼瑶瑷瑸璎瓒瓮瓯电画畅畴疖疗疟疠疡疬疭疮疯疱疴痈痉痒痖痨痪痫瘅瘆瘗瘘瘪瘫瘾瘿癞癣癫皑皱皲盏盐监盖盗盘眍眦眬睁睐睑瞆瞒瞩矫矶矾矿砀码砖砗砚砜砺砻砾础硁硕硖硗硙硚确硵碍碛碜碱硷礼祃祎祢祯祷祸禀禄禅离秃秆种积称秽秾稆税稣稳穑穞穷窃窍窎窑窜窝窥窦窭竖竞笃笋笔笕笺笼笾筚筛筜筝筹筼签筿简箓箦箧箨箩箪箫篑篓篮篯篱簖籁籴类籼粜粝粤粪粮糁糇糍紧絷緼縆纟纠纡红纣纤纥约级纨纩纪纫纬纭纮纯纰纱纲纳纴纵纶纷纸纹纺纻纼纽纾线绀绁绂练组绅细织终绉绊绋绌绍绎经绐绑绒结绔绕绖绗绘给绚绛络绝绞统绠绡绢绣绤绥绦继绨绩绪绫绬续绮绯绰绱绲绳维绵绶绷绸绹绺绻综绽绾绿缀缁缂缃缄缅缆缇缈缉缊缋缌缍缎缏缐缑缒缓缔缕编缗缘缙缚缛缜缝缞缟缠缡缢缣缤缥缦缧缨缩缪缫缬缭缮缯缰缱缲缳缴缵罂网罗罚罢罴羁羟羡翘翙翚耢耧耸耻聂聋职聍联聩聪肃肠肤肮肾肿胀胁胆胜胧胨胪胫胶脉脍脏脐脑脓脔脚脱脶脸腊腘腭腻腼腽腾膑臜舆舣舰舱舻艰艳艺节芈芗芜芦苁苇苈苋苌苍苎苏苧苹茎茏茑茔茕茧荆荙荚荛荜荝荞荟荠荡荣荤荥荦荧荨荩荪荫荬荭荮药莅莱莲莳莴莶获莸莹莺莼萚萝萤营萦萧萨葱蒀蒇蒉蒋蒌蒏蓝蓟蓠蓣蓥蓦蔂蔷蔹蔺蔼蕰蕲蕴薮藓藴蘖虏虑虚虬虮虽虾虿蚀蚁蚂蚃蚕蚝蚬蛊蛎蛏蛮蛰蛱蛲蛳蛴蜕蜗蜡蝇蝈蝉蝎蝼蝾螀螨蟏衅衔补衬衮袄袅袆袜袭袯装裆裈裢裣裤裥褛褴襕见观觃规觅视觇览觉觊觋觌觍觎觏觐觑觞触觯訚詟誉誊讠计订讣认讥讦讧讨让讪讫讬训议讯记讱讲讳讴讵讶讷许讹论讻讼讽设访诀证诂诃评诅识诇诈诉诊诋诌词诎诏诐译诒诓诔试诖诗诘诙诚诛诜话诞诟诠诡询诣诤该详诧诨诩诪诫诬语诮误诰诱诲诳说诵诶请诸诹诺读诼诽课诿谀谁谂调谄谅谆谇谈谉谊谋谌谍谎谏谐谑谒谓谔谕谖谗谘谙谚谛谜谝谞谟谠谡谢谣谤谥谦谧谨谩谪谫谬谭谮谯谰谱谲谳谴谵谶豮贝贞负贠贡财责贤败账货质贩贪贫贬购贮贯贰贱贲贳贴贵贶贷贸费贺贻贼贽贾贿赀赁赂赃资赅赆赇赈赉赊赋赌赍赎赏赐赑赒赓赔赕赖赗赘赙赚赛赜赝赞赟赠赡赢赣赪赵赶趋趱趸跃跄跞践跶跷跸跹跻踌踪踬踯蹑蹒蹰蹿躏躜躯輼车轧轨轩轪轫转轭轮软轰轱轲轳轴轵轶轷轸轹轺轻轼载轾轿辀辁辂较辄辅辆辇辈辉辊辋辌辍辎辏辐辑辒输辔辕辖辗辘辙辚辞辩辫边辽达迁过迈运还这进远违连迟迩迳迹选逊递逦逻遗遥邓邝邬邮邹邺邻郏郐郑郓郦郧郸酂酝酦酱酽酾酿醖释鉴銮錾钅钆钇针钉钊钋钌钍钎钏钐钑钒钓钔钕钖钗钘钙钚钛钜钝钞钟钠钡钢钣钤钥钦钧钨钩钪钫钬钭钮钯钰钱钲钳钴钵钶钷钸钹钺钻钼钽钾钿铀铁铂铃铄铅铆铇铈铉铊铋铌铍铎铏铐铑铒铓铔铕铖铗铘铙铚铛铜铝铞铟铠铡铢铣铤铥铦铧铨铩铪铫铬铭铮铯铰铱铲铳铴铵银铷铸铹铺铻铼铽链铿销锁锂锃锄锅锆锇锈锉锊锋锌锍锎锏锐锑锒锓锔锕锖锗锘错锚锛锜锝锞锟锠锡锢锣锤锥锦锧锨锩锪锫锬锭键锯锰锱锲锳锴锵锶锷锸锹锺锻锼锽锾锿镀镁镂镃镄镅镆镇镈镉镊镋镌镍镎镏镐镑镒镓镔镕镖镗镘镙镚镛镜镝镞镟镠镡镢镣镤镥镦镧镨镩镪镫镬镭镮镯镰镱镲镳镴镵镶长门闩闪闫闬闭问闯闰闱闲闳间闵闶闷闸闹闺闻闼闽闾闿阀阁阂阃阄阅阆阇阈阉阊阋阌阍阎阏阐阑阒阓阔阕阖阗阘阙阚阛队阳阴阵阶际陆陇陈陉陕陦陧陨险随隐隶隽难雏雠雳雾霁霡霭靓靔静靥鞑鞒鞯鞲韦韧韨韩韪韫韬韵页顶顷顸项顺须顼顽顾顿颀颁颂颃预颅领颇颈颉颊颋颌颍颎颏颐频颒颓颔颕颖颗题颙颚颛颜额颞颟颠颡颢颣颤颥颦颧风飏飐飑飒飓飔飕飖飗飘飙飚飞飨餍饣饤饥饦饧饨饩饪饫饬饭饮饯饰饱饲饳饴饵饶饷饸饹饺饻饼饽饾饿馀馁馂馃馄馅馆馇馈馉馊馋馌馍馎馏馐馑馒馓馔馕马驭驮驯驰驱驲驳驴驵驶驷驸驹驺驻驼驽驾驿骀骁骂骃骄骅骆骇骈骉骊骋验骍骎骏骐骑骒骓骔骕骖骗骘骙骚骛骜骝骞骟骠骡骢骣骤骥骦骧髅髋髌鬓鬶魇魉鱼鱽鱾鱿鲀鲁鲂鲃鲄鲅鲆鲇鲈鲉鲊鲋鲌鲍鲎鲏鲐鲑鲒鲓鲔鲕鲖鲗鲘鲙鲚鲛鲜鲝鲞鲟鲠鲡鲢鲣鲤鲥鲦鲧鲨鲩鲪鲫鲬鲭鲮鲯鲰鲱鲲鲳鲴鲵鲶鲷鲸鲹鲺鲻鲼鲽鲾鲿鳀鳁鳂鳃鳄鳅鳆鳇鳈鳉鳊鳋鳌鳍鳎鳏鳐鳑鳒鳓鳔鳕鳖鳗鳘鳙鳚鳛鳜鳝鳞鳟鳠鳡鳢鳣鳤鸟鸠鸡鸢鸣鸤鸥鸦鸧鸨鸩鸪鸫鸬鸭鸮鸯鸰鸱鸲鸳鸴鸵鸶鸷鸸鸹鸺鸻鸼鸽鸾鸿鹀鹁鹂鹃鹄鹅鹆鹇鹈鹉鹊鹋鹌鹍鹎鹏鹐鹑鹒鹓鹔鹕鹖鹗鹘鹙鹚鹛鹜鹝鹞鹟鹠鹡鹢鹣鹤鹥鹦鹧鹨鹩鹪鹫鹬鹭鹮鹯鹰鹱鹲鹳鹴鹾麦麸麹麺麽黄黉黡黩黪黾鼋鼌鼍鼹齐齑齿龀龁龂龃龄龅龆龇龈龉龊龋龌龙龚龛龟鿎鿏鿒鿔着]/;
  // Traditional Chinese phrases using shared characters (e.g., 面/后/里/干).
  // Guards against false positives on non-CN pages where these characters
  // appear in their Traditional Chinese meaning (面=face, not 麵=noodle).
  // Add phrases here as needed when over-conversion is observed.
  const tradSharedPhraseRegex = /(?:面前|面對|當面)/;

  function containsSimplifiedChinese(text) {
    if (typeof text !== 'string' || text.length === 0) {
      return false;
    }
    // Fast path 1: must contain at least one CJK character
    if (!cjkRegex.test(text)) {
      return false;
    }
    // Fast path 2: definitive simplified-only characters → must convert
    if (simpCharRegex.test(text)) {
      return true;
    }
    // Fast path 3: Traditional phrases with shared characters → not simplified
    if (tradSharedPhraseRegex.test(text)) {
      return false;
    }
    return false;
  }

  const SKIP_TAGS = new Set([
    'script',
    'style',
    'noscript',
    'code',
    'pre',
    'kbd',
    'samp',
    'var',
    'math',
    'svg',
    'input',
    'textarea',
  ]);

  const SKIP_SELECTOR = 'script, style, noscript, code, pre, kbd, samp, var, math, svg, input, textarea';

  function isSkipElementDirect(element) {
    if (!element || element.nodeType !== Node.ELEMENT_NODE) {
      return false;
    }
    if (element.isContentEditable) {
      return true;
    }
    const tag = element.tagName.toLowerCase();
    return SKIP_TAGS.has(tag);
  }

  function shouldSkipElementWithAncestors(element) {
    if (!element) {
      return true;
    }
    if (element.nodeType !== Node.ELEMENT_NODE) {
      element = element.parentElement;
      if (!element) {
        return true;
      }
    }
    if (element.isContentEditable || element.closest('[contenteditable="true"], [contenteditable=""]')) {
      return true;
    }
    const tag = element.tagName.toLowerCase();
    if (SKIP_TAGS.has(tag)) {
      return true;
    }
    if (element.closest && element.closest(SKIP_SELECTOR)) {
      return true;
    }
    return false;
  }

  const CONVERT_ATTRS = ['placeholder', 'alt', 'title', 'aria-label'];

  function convertAttribute(element, attr) {
    if (!element || shouldSkipElementWithAncestors(element) || CONVERT_ATTRS.indexOf(attr) === -1) {
      return;
    }
    const val = element.getAttribute(attr);
    if (!val || !containsSimplifiedChinese(val)) {
      return;
    }
    const converted = converter(val);
    if (val !== converted) {
      element.setAttribute(attr, converted);
    }
  }

  function convertAttributes(root) {
    if (
      !root ||
      (root.nodeType !== Node.ELEMENT_NODE && root.nodeType !== Node.DOCUMENT_FRAGMENT_NODE)
    ) {
      return;
    }

    const selector = '[placeholder], [alt], [title], [aria-label]';
    const elements = [];

    if (root.matches && root.matches(selector)) {
      elements.push(root);
    }

    if (root.querySelectorAll) {
      const children = root.querySelectorAll(selector);
      for (let i = 0; i < children.length; i++) {
        elements.push(children[i]);
      }
    }

    for (let i = 0; i < elements.length; i++) {
      const el = elements[i];
      if (shouldSkipElementWithAncestors(el)) {
        continue;
      }
      for (let j = 0; j < CONVERT_ATTRS.length; j++) {
        convertAttribute(el, CONVERT_ATTRS[j]);
      }
    }
  }

  function convertSingleTextNode(node) {
    const parent = node.parentElement;
    if (!parent || shouldSkipElementWithAncestors(parent)) {
      return;
    }
    const original = node.nodeValue;
    if (!original || original.trim() === '') {
      return;
    }
    if (!containsSimplifiedChinese(original)) {
      return;
    }
    const converted = converter(original);
    if (original !== converted) {
      node.nodeValue = converted;
    }
  }

  function convertSubtree(root) {
    if (
      !root ||
      (root.nodeType !== Node.ELEMENT_NODE && root.nodeType !== Node.DOCUMENT_FRAGMENT_NODE)
    ) {
      return;
    }

    if (root.nodeType === Node.ELEMENT_NODE && shouldSkipElementWithAncestors(root)) {
      return;
    }

    const textNodes = [];
    const walker = document.createTreeWalker(
      root,
      NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT,
      {
        acceptNode(node) {
          if (node.nodeType === Node.ELEMENT_NODE) {
            if (isSkipElementDirect(node)) {
              return NodeFilter.FILTER_REJECT;
            }
            return NodeFilter.FILTER_SKIP;
          }
          if (node.nodeType === Node.TEXT_NODE) {
            if (!node.nodeValue || node.nodeValue.trim() === '') {
              return NodeFilter.FILTER_SKIP;
            }
            return NodeFilter.FILTER_ACCEPT;
          }
          return NodeFilter.FILTER_SKIP;
        },
      }
    );

    let currentNode = walker.nextNode();
    while (currentNode) {
      textNodes.push(currentNode);
      currentNode = walker.nextNode();
    }

    for (let i = 0; i < textNodes.length; i++) {
      const textNode = textNodes[i];
      const original = textNode.nodeValue;
      if (!containsSimplifiedChinese(original)) {
        continue;
      }
      const converted = converter(original);
      if (original !== converted) {
        textNode.nodeValue = converted;
      }
    }

    convertAttributes(root);
  }

  const observedRoots = new WeakSet();
  let dynamicObserver = null;
  let initialized = false;
  let startupRetryCount = 0;
  const MAX_STARTUP_RETRIES = 50;
  const startupObserver = new MutationObserver(main);

  function observeShadowRoots(root) {
    if (!root) {
      return;
    }

    if (root.shadowRoot && !observedRoots.has(root.shadowRoot)) {
      observeDynamicChanges(root.shadowRoot);
      convertSubtree(root.shadowRoot);
    }

    if (!root.querySelectorAll) {
      return;
    }

    const descendants = root.querySelectorAll('*');
    for (let i = 0; i < descendants.length; i++) {
      const shadowRoot = descendants[i].shadowRoot;
      if (shadowRoot && !observedRoots.has(shadowRoot)) {
        observeDynamicChanges(shadowRoot);
        convertSubtree(shadowRoot);
      }
    }
  }

  // Batch queue for dynamic mutations to avoid layout thrashing
  const pendingAddedElements = new Set();
  const pendingAddedTextNodes = new Set();
  const pendingAttributes = [];
  let isBatchScheduled = false;

  function flushBatch() {
    isBatchScheduled = false;

    while (pendingAttributes.length > 0) {
      const item = pendingAttributes.shift();
      if (item.target && (item.target.isConnected === undefined || item.target.isConnected)) {
        convertAttribute(item.target, item.name);
      }
    }

    for (const textNode of pendingAddedTextNodes) {
      if (textNode.isConnected === undefined || textNode.isConnected) {
        convertSingleTextNode(textNode);
      }
    }
    pendingAddedTextNodes.clear();

    for (const el of pendingAddedElements) {
      if (el.isConnected === undefined || el.isConnected) {
        convertSubtree(el);
        observeShadowRoots(el);
      }
    }
    pendingAddedElements.clear();
  }

  function scheduleBatch() {
    if (isBatchScheduled) {
      return;
    }
    isBatchScheduled = true;
    if (typeof requestAnimationFrame === 'function') {
      requestAnimationFrame(flushBatch);
    } else {
      setTimeout(flushBatch, 0);
    }
  }

  function observeDynamicChanges(root) {
    if (!root) {
      return;
    }

    if (!dynamicObserver) {
      dynamicObserver = new MutationObserver(function (mutations) {
        for (let i = 0; i < mutations.length; i++) {
          const mutation = mutations[i];
          if (mutation.type === 'attributes') {
            pendingAttributes.push({ target: mutation.target, name: mutation.attributeName });
            continue;
          }
          if (mutation.type === 'characterData') {
            pendingAddedTextNodes.add(mutation.target);
            continue;
          }
          const addedNodes = mutation.addedNodes;
          for (let j = 0; j < addedNodes.length; j++) {
            const node = addedNodes[j];
            if (node.nodeType === Node.ELEMENT_NODE) {
              pendingAddedElements.add(node);
            } else if (node.nodeType === Node.TEXT_NODE) {
              pendingAddedTextNodes.add(node);
            }
          }
        }
        scheduleBatch();
      });
    }

    if (!observedRoots.has(root)) {
      dynamicObserver.observe(root, {
        childList: true,
        subtree: true,
        characterData: true,
        attributes: true,
        attributeFilter: CONVERT_ATTRS,
      });
      observedRoots.add(root);
    }

    observeShadowRoots(root);
  }

  function observeTitleChanges() {
    const titleEl = document.querySelector('title');
    if (!titleEl) {
      return;
    }
    const updateTitle = () => {
      const orig = document.title;
      if (orig && containsSimplifiedChinese(orig)) {
        const conv = converter(orig);
        if (orig !== conv) {
          document.title = conv;
        }
      }
    };
    const titleObserver = new MutationObserver(updateTitle);
    titleObserver.observe(titleEl, {
      childList: true,
      characterData: true,
      subtree: true,
    });
  }

  function main() {
    if (initialized) {
      return;
    }

    const openCC = getOpenCC();
    if (!openCC || !openCC.Converter) {
      startupRetryCount++;
      if (startupRetryCount < MAX_STARTUP_RETRIES) {
        return;
      }
      initialized = true;
      startupObserver.disconnect();
      return;
    }

    const langResult = checkStep1Lang();
    if (langResult === false) {
      initialized = true;
      startupObserver.disconnect();
      return;
    }

    converter = openCC.Converter({ from: 'cn', to: 'twp' });
    initialized = true;
    startupObserver.disconnect();

    if (document.title) {
      const originalTitle = document.title;
      if (containsSimplifiedChinese(originalTitle)) {
        const convertedTitle = converter(originalTitle);
        if (originalTitle !== convertedTitle) {
          document.title = convertedTitle;
        }
      }
    }
    observeTitleChanges();

    if (document.body) {
      convertSubtree(document.body);
      observeDynamicChanges(document);
    }
  }

  startupObserver.observe(document, {
    childList: true,
    subtree: true,
    characterData: true,
  });
  main();
})();

(() => {
  "use strict";

  const VERSION = "0.8.5";
  const LOCAL_KEY = "farm-roll-online-v0.8.0";
  const LEGACY_KEYS = ["farm-roll-online-v0.7.1","farm-roll-online-v0.7.0","farm-roll-online-v0.6.9","farm-roll-online-v0.6.8","farm-roll-online-v0.6.7","farm-roll-online-v0.6.5","farm-roll-online-v0.6.4","farm-roll-online-v0.6.3","farm-roll-online-v0.6.2","farm-roll-online-v0.6.1","farm-roll-online-v0.6","farm-roll-online-v0.5b","farm-roll-online-v0.5a2","farm-roll-online-v0.5a1","farm-roll-online-v0.5a","farm-roll-online-v0.4b"];
  const POLL_MS = 3500;
  const DICE_DEF = [
    {id:"w1",name:"White 1",type:"white",sides:6},
    {id:"w2",name:"White 2",type:"white",sides:6},
    {id:"w3",name:"White 3",type:"white",sides:6},
    {id:"black",name:"Black",type:"black",sides:6},
    {id:"livestock",name:"Livestock",type:"livestock",sides:8},
    {id:"crop",name:"Crop",type:"crop",sides:8}
  ];

  const SLOT_CAPS = [16,16,16,16,16,16,11,11,11,11,11,11,6,6,6,6,6,6];

  const DECK_ORDERS = {
    base:["Spring","Summer","Fall","Winter","North","South"],
    intermediate:["Spring","Summer","Fall","Winter","Tropical","Standard"]
  };
  const INTERMEDIATE_DECK_HELPERS = window.FARM_ROLL_DECKS || {};
  const BASE_DECK_HELPERS = window.FARM_ROLL_BASE_DECKS || {};
  const ALL_DECK_THEMES = [...new Set([...DECK_ORDERS.base,...DECK_ORDERS.intermediate])];
  // v0.8.0 board choices are loaded from Supabase so setup, rendering, and rules
  // all use the same canonical 30 Base + 30 Intermediate V2 definitions.
  let ALL_PRESET_OPTIONS = ["Standard"];
  let FAMILY_PRESETS = {base:["Standard"],intermediate:[]};
  const BOARD_CATALOGS = {base:[],intermediate:[]};

  const MARKET_ORDER = ["Eggs","Grains","Vegetables","Milk","Clothes","Fruit","Meat","Sweets","Vices"];
  const MARKET_META = {
    Eggs:{icon:"🥚",prices:[1,1,2,2,3,3,3,3,3,4,4,4,5]},
    Grains:{icon:"🍞",prices:[1,1,2,2,3,3,3,3,3,4,4,5,6]},
    Vegetables:{icon:"🥗",prices:[1,1,2,3,3,3,3,3,3,4,4,5,6]},
    Milk:{icon:"🥛",prices:[1,2,3,3,4,4,4,4,4,5,5,6,6]},
    Clothes:{icon:"👕",prices:[1,1,2,3,4,4,4,4,5,5,6,6,7]},
    Fruit:{icon:"🍏",prices:[1,1,1,2,3,4,4,4,5,5,6,7,9]},
    Meat:{icon:"🥩",prices:[1,1,2,3,4,5,5,5,6,6,7,8,9]},
    Sweets:{icon:"🍬",prices:[1,1,2,2,4,5,6,7,8,9,10,12,14]},
    Vices:{icon:"🥂",prices:[1,1,3,4,5,6,7,8,9,10,11,13,15]}
  };

  // Exact printed Play Cards track from the current Standard Player Board.
  // Read left-to-right: top row (10), middle row (13), bottom row (13).
  // H=🏠 play into hidden Event Deck; T=🏘 play + trigger Event Resolution; D=🏚 discard +3 VP.
  const PLAY_TRACK_TYPES = [
    "H","H","H","T","H","H","H","H","T","D",
    "H","H","H","D","T","D","H","H","H","T","H","H","H",
    "T","D","H","H","D","H","H","T","D","H","H","H","D"
  ];
  const PLAY_ROW_LENGTHS = [10,13,13];
  const PLAY_ICON = {H:"🏠",T:"🏘️",D:"🏚️"};

  const RESOURCES = {
    1:{name:"Rooster",short:"Roost♂",icon:"🐓"}, 2:{name:"Hen",short:"Hen♀",icon:"🐔"},
    3:{name:"Drake",short:"Drake♂",icon:"🦆"}, 4:{name:"Female Duck",short:"Duck♀",icon:"🦢"},
    5:{name:"Rabbit Buck",short:"Rab♂",icon:"🐿️"}, 6:{name:"Rabbit Doe",short:"Rab♀",icon:"🐇"},
    7:{name:"Ram",short:"Ram♂",icon:"🐏"}, 8:{name:"Ewe",short:"Ewe♀",icon:"🐑"},
    9:{name:"Goat Buck",short:"Goat♂",icon:"🦌"}, 10:{name:"Goat Doe",short:"Goat♀",icon:"🐐"},
    11:{name:"Boar",short:"Boar♂",icon:"🐗"}, 12:{name:"Sow",short:"Sow♀",icon:"🐖"},
    13:{name:"Turkey Tom",short:"Turk♂",icon:"🦚"}, 14:{name:"Turkey Hen",short:"Turk♀",icon:"🦃"},
    15:{name:"Bull",short:"Bull♂",icon:"🐂"}, 16:{name:"Cow",short:"Cow♀",icon:"🐄"},
    17:{name:"Stallion",short:"Stall♂",icon:"🐎"}, 18:{name:"Mare",short:"Mare♀",icon:"🐴"},
    19:{name:"Wheat",short:"Wheat",icon:"🌾"}, 20:{name:"Corn",short:"Corn",icon:"🌽"},
    21:{name:"Potatoes",short:"Spud",icon:"🥔"}, 22:{name:"Soybeans",short:"Soy",icon:"🫘"},
    23:{name:"Carrots",short:"Carot",icon:"🥕"}, 24:{name:"Tomatoes",short:"Tomat",icon:"🍅"},
    25:{name:"Rice",short:"Rice",icon:"🍚"}, 26:{name:"Cotton",short:"Cottn",icon:"🧶"},
    27:{name:"Apple Orchard",short:"Apple",icon:"🍎"}, 28:{name:"Grape Vineyard",short:"Grape",icon:"🍇"},
    29:{name:"Peach Orchard",short:"Peach",icon:"🍑"}, 30:{name:"Orange Grove",short:"Orng",icon:"🍊"},
    31:{name:"Blueberry Farm",short:"Blue",icon:"🫐"}, 32:{name:"Beehives",short:"Hives",icon:"🐝🍯"},
    33:{name:"Coffee Plantation",short:"Coff",icon:"☕"}, 34:{name:"Tobacco Field",short:"Tobac",icon:"🚬"},
    35:{name:"Cherry Orchard",short:"Cherr",icon:"🍒"}, 36:{name:"Maple Trees",short:"Maple",icon:"🍁"},
    37:{name:"Alpaca Male",short:"Alp♂",icon:"🐫"}, 38:{name:"Alpaca Female",short:"Alp♀",icon:"🦙"},
    39:{name:"Gander",short:"Gand♂",icon:"🦩"}, 40:{name:"Female Goose",short:"Goos♀",icon:"🪿"},
    41:{name:"Jack Donkey",short:"Jack♂",icon:"🦓"}, 42:{name:"Jenny Donkey",short:"Jenny♀",icon:"🫏"},
    43:{name:"Strawberries",short:"Straw",icon:"🍓"}, 44:{name:"Peppers",short:"Pepr",icon:"🌶️"},
    45:{name:"Sugar Cane",short:"Cane",icon:"🎋"}, 46:{name:"Avocados",short:"Avoca",icon:"🥑"},
    47:{name:"Cacao",short:"Cacao",icon:"🍫"}, 48:{name:"Oats",short:"Oats",icon:"🥣"},
    49:{name:"Watermelon Patch",short:"Wtrmln",icon:"🍉"}, 50:{name:"Tea Plantation",short:"Tea",icon:"🍵"}
  };

  // New-player helper: choose the strongest production efficiency. If multiple current-card
  // ratios are equally efficient, show the MORE demanding actual ratio so players can plan
  // enough copies for the larger payout. Apple separately calls out its 5-bee ceiling.
  // Canonical legal board-slot ranges from the Random Board Generator workbook.
  // These are mirrored server-side so future approved/random layouts cannot place a resource outside its allowed rows.
  const RESOURCE_SLOT_LIMITS = {
    1:[1,7],2:[1,8],3:[1,9],4:[1,9],5:[1,10],6:[2,10],7:[6,14],8:[8,16],9:[4,16],10:[5,17],
    11:[6,16],12:[6,17],13:[5,15],14:[6,16],15:[8,18],16:[9,18],17:[10,18],18:[10,18],
    19:[1,6],20:[1,7],21:[1,8],22:[1,9],23:[2,10],24:[3,11],25:[4,11],26:[7,14],27:[4,12],28:[4,14],
    29:[7,15],30:[8,18],31:[6,16],32:[6,18],33:[9,18],34:[13,18],35:[8,18],36:[11,18],
    37:[7,18],38:[8,18],39:[5,15],40:[6,16],41:[6,18],42:[9,18],43:[9,15],44:[1,12],45:[7,18],46:[6,18],
    47:[12,18],48:[3,12],49:[5,17],50:[5,18]
  };

  const RESOURCE_HELPERS = {
    1:"🔪 2🥩/1", 2:"🥚 4/2 • 🔪 2🥩/1", 3:"🔪 3🥩/1", 4:"🥚 5/3 • 🔪 3🥩/1",
    5:"🔪 2🥩/1 OR 1👕/1", 6:"🔪 2🥩/1 OR 1👕/1",
    7:"👕 4/2 • 🔪 4🥩/1 OR 2👕/1", 8:"👕 4/2 • 🔪 4🥩/1 OR 2👕/1",
    9:"🔪 3🥩/1", 10:"🥛 5/3 • 🔪 3🥩/1", 11:"🔪 5🥩/1", 12:"🔪 5🥩/1",
    13:"🔪 4🥩/1", 14:"🥚 4/3 • 🔪 4🥩/1",
    15:"🔪 5🥩/1 OR 3👕/1", 16:"🥛 4/2 • 🔪 5🥩/1 OR 3👕/1",
    17:"🔪 4🥩/1 OR 5👕/1", 18:"🔪 4🥩/1 OR 5👕/1",
    19:"🍞 4/3", 20:"🍞 5/3", 21:"🥗 4/3", 22:"🍞 4/2",
    23:"🥗 5/3 + 🐝", 24:"🥗 4/2 + 🐝🐝", 25:"🍞 4/2", 26:"👕 3/1",
    27:"🍏 4/3 + 🐝🐝🐝 • Max 🐝 5", 28:"🍏 5/3", 29:"🍏 4/2 + 🐝🐝🐝",
    30:"🍏 4/1 + 🐝🐝", 31:"🍏 3/1 + 🐝🐝🐝", 32:"🍬 4/3", 33:"🥂 3/1",
    34:"🥂 4/1", 35:"🍏 4/1 + 🐝🐝🐝", 36:"🍬 4/1",
    37:"👕 4/2 • 🔪 4🥩/1 OR 3👕/1", 38:"👕 4/2 • 🔪 4🥩/1 OR 3👕/1",
    39:"🔪 3🥩/1", 40:"🥚 4/3 • 🔪 3🥩/1", 41:"🔪 4🥩/1 OR 4👕/1",
    42:"🥛 4/3 • 🔪 4🥩/1 OR 4👕/1", 43:"🍏 5/1 + 🐝🐝🐝",
    44:"🥗 4/3 + 🐝", 45:"🍬 4/2", 46:"🍏 4/1 + 🐝", 47:"🍬 3/1 + 🐝🐝",
    48:"🍞 5/3", 49:"🍏 3/1 + 🐝🐝🐝", 50:"🥂 4/2"
  };

  const BOARD_MAPS = {
    Standard:{
      livestock:[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18],
      crop:[19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36]
    },
    B1:{
      livestock:[5,4,6,3,11,9,1,2,7,12,10,16,15,8,13,18,17,14],
      crop:[19,23,20,22,24,21,26,27,28,25,34,29,32,31,30,35,36,33]
    },
    B2:{
      livestock:[2,6,3,4,11,1,7,5,13,18,10,9,14,8,17,12,15,16],
      crop:[21,20,23,19,25,32,31,22,27,28,24,26,29,36,33,30,35,34]
    },
    B3:{
      livestock:[1,3,2,4,9,10,5,6,7,13,17,8,12,18,11,16,14,15],
      crop:[21,20,24,23,26,19,31,22,25,30,34,35,27,28,29,36,32,33]
    },
    B4:{
      livestock:[2,5,4,1,6,9,3,10,15,18,11,8,12,7,14,13,17,16],
      crop:[21,20,19,25,22,23,27,31,24,26,29,30,35,28,36,32,34,33]
    },
    I1:{
      livestock:[5,4,6,3,11,9,39,10,7,12,40,16,15,8,13,18,17,14],
      crop:[19,23,20,22,24,48,26,27,28,44,25,29,32,31,30,50,45,33]
    },
    I2:{
      livestock:[2,6,3,4,11,1,7,5,42,18,10,9,41,8,17,12,37,38],
      crop:[21,20,23,50,25,32,31,22,27,44,24,26,43,36,46,30,47,34]
    },
    I3:{
      livestock:[1,3,2,4,9,10,5,6,7,13,39,8,12,40,11,16,14,15],
      crop:[21,20,24,23,26,44,31,43,45,30,34,35,47,50,36,46,49,33]
    },
    I4:{
      livestock:[2,5,4,1,6,9,3,10,15,18,37,8,38,7,14,13,17,16],
      crop:[21,20,19,25,49,44,27,31,24,26,29,48,35,28,36,46,34,47]
    }
  };

  const $ = s => document.querySelector(s);
  let sb = null;
  let pollTimer = null;
  let ui = loadLocal();
  // Restore canonical V2 board maps cached from the last successful catalog load.
  // This prevents a transient auth/catalog failure from relabeling a saved V2 board as Standard.
  if(ui.boardMaps && typeof ui.boardMaps==="object"){
    Object.entries(ui.boardMaps).forEach(([key,map])=>{
      if(Array.isArray(map?.livestock)&&map.livestock.length===18&&Array.isArray(map?.crop)&&map.crop.length===18){
        BOARD_MAPS[key]={livestock:map.livestock.map(Number),crop:map.crop.map(Number)};
      }
    });
  }
  let backgroundRenderPending = false;
  let interactionHoldUntil = 0;
  let railInteractionDepth = 0;
  let railReleaseTimer = null;
  let autoPlaySubmitting = false;
  let autoBotsRunning = false;
  const scrollMemory = Object.create(null);

  function freshLocal(){
    return {
      screen:"home", busy:false, message:"",
      gameId:null, playerId:null, roomCode:null, playerName:"",
      isHost:false, server:null, farmView:"livestock", workspaceView:"play", playChoices:[], fenceDraft:[], fenceRow:1,
      butcherDraft:{key:"",choices:{}}, vanityDraft:{left:null,right:null}, drawDraft:{}, initiativeCards:[], powerState:null, marketChartOpen:false,
      openDeckSlot:null, liveFarmOpen:{}, finalOpenPlayers:{}, finalAuditOpen:{}, boardMaps:{}, editor:newEditor()
    };
  }
  function newEditor(){
    return {actionType:"livestock",blackFace:1,actions:[],selected:[],used:[],committedTarget:1};
  }
  function loadLocal(){
    try {
      const raw=localStorage.getItem(LOCAL_KEY) || LEGACY_KEYS.map(k=>localStorage.getItem(k)).find(Boolean) || "{}";
      return {...freshLocal(), ...JSON.parse(raw)};
    } catch { return freshLocal(); }
  }
  function saveLocal(){ localStorage.setItem(LOCAL_KEY, JSON.stringify(ui)); }
  function configured(){
    const c=window.FARM_ROLL_CONFIG||{};
    return /^https:\/\/.+\.supabase\.co\/?$/.test(c.supabaseUrl||"") &&
      !!c.supabasePublishableKey && !String(c.supabasePublishableKey).startsWith("PASTE_");
  }
  function esc(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));}
  function inviteRoomCode(){
    try{return (new URLSearchParams(window.location.search).get("room")||"").toUpperCase().replace(/[^A-Z0-9]/g,"").slice(0,5);}
    catch{return "";}
  }
  function inviteUrl(){
    const url=new URL(window.location.href);
    url.search="";url.hash="";url.searchParams.set("room",String(ui.roomCode||"").toUpperCase());
    return url.toString();
  }
  function statusMsg(msg, isError=false){ ui.message=msg?`${isError?"ERR:":""}${msg}`:""; saveLocal(); render(); }

  async function init(){
    if(!configured()){ render(); return; }
    try{
      const c=window.FARM_ROLL_CONFIG;
      sb=window.supabase.createClient(c.supabaseUrl,c.supabasePublishableKey);
      const {data:{session}}=await sb.auth.getSession();
      if(!session){
        const {error}=await sb.auth.signInAnonymously();
        if(error) throw error;
      }
      let catalogError=null;
      try{ await loadBoardCatalogs(); }catch(e){ catalogError=e; }
      if(ui.gameId){
        ui.screen="room";
        try{
          await refreshRoom(false);
          startPolling();
        }catch(e){
          ui.message="ERR:"+friendly(e);
        }
      }
      if(catalogError && !ui.message) ui.message="ERR:"+friendly(catalogError);
    }catch(e){
      ui.message="ERR:"+friendly(e);
    }
    render();
  }

  async function rpc(name,args={}){
    if(!sb) throw new Error("Supabase is not connected.");
    let {data,error}=await sb.rpc(name,args);
    if(error && /jwt expired|invalid jwt|authentication required/i.test(String(error?.message||error))){
      try{
        const {data:refreshed}=await sb.auth.refreshSession();
        if(!refreshed?.session){ await sb.auth.signInAnonymously(); }
        ({data,error}=await sb.rpc(name,args));
      }catch(_){ /* preserve original RPC error below */ }
    }
    if(error) throw error;
    return data;
  }
  function rpcMissingError(e){
    const msg=String(e?.message||e||"");
    return /Could not find the function|function .* does not exist|PGRST202|schema cache/i.test(msg);
  }

  function boardCatalogEntry(value){
    return [...(BOARD_CATALOGS.base||[]),...(BOARD_CATALOGS.intermediate||[])].find(x=>x.value===value)||null;
  }
  function presetShortLabel(value){
    if(value==="Standard") return "Standard";
    return boardCatalogEntry(value)?.label || String(value||"");
  }
  async function loadBoardCatalogs(){
    const [base,intermediate]=await Promise.all([
      rpc("farm_roll_board_catalog_v1",{p_deck_family:"base"}),
      rpc("farm_roll_board_catalog_v1",{p_deck_family:"intermediate"})
    ]);
    BOARD_CATALOGS.base=Array.isArray(base)?base:[];
    BOARD_CATALOGS.intermediate=Array.isArray(intermediate)?intermediate:[];
    FAMILY_PRESETS={
      base:BOARD_CATALOGS.base.map(x=>x.value),
      intermediate:BOARD_CATALOGS.intermediate.map(x=>x.value)
    };
    ALL_PRESET_OPTIONS=[...new Set([...FAMILY_PRESETS.base,...FAMILY_PRESETS.intermediate])];
    const cachedMaps={...(ui.boardMaps||{})};
    [...BOARD_CATALOGS.base,...BOARD_CATALOGS.intermediate].forEach(x=>{
      if(x?.value && Array.isArray(x.livestock_ids) && Array.isArray(x.crop_ids)){
        const map={livestock:x.livestock_ids.map(Number),crop:x.crop_ids.map(Number)};
        BOARD_MAPS[x.value]=map;
        cachedMaps[x.value]=map;
      }
    });
    ui.boardMaps=cachedMaps;
    saveLocal();
  }

  async function createGame(){
    const name=$("#createName")?.value.trim();
    const deckFamily=$("#createDeckFamily")?.value||"base";
    const boardMode=$("#createBoardMode")?.value||"symmetric";
    const defaultPreset=(FAMILY_PRESETS[deckFamily]||[])[0]||"Standard";
    const livestock=$("#createLivestock")?.value||defaultPreset;
    const crop=$("#createCrop")?.value||defaultPreset;
    const rawMax=($("#createMaxReveals")?.value||"").trim();
    const maxReveals=rawMax===""?null:Number(rawMax);
    const powersEnabled=($("#createPowers")?.value||"on")!=="off";
    const botCount=Number($("#createBotCount")?.value||0);
    const botConfigs=readBotConfigs();
    if(!name){ statusMsg("Enter your name.",true); return; }
    if(maxReveals!==null && (!Number.isInteger(maxReveals)||maxReveals<1)){ statusMsg("Maximum Event Reveals must be a positive whole number or left blank.",true); return; }
    if(!Number.isInteger(botCount)||botCount<0||botCount>7){ statusMsg("Choose between 0 and 7 bots.",true); return; }
    if(botConfigs.length!==botCount){ statusMsg("Bot setup is incomplete. Re-select the bot count and try again.",true); return; }
    await busy(async()=>{
      try{
        const data=await rpc("farm_roll_create_game_v70",{
          p_display_name:name,
          p_deck_family:deckFamily,
          p_livestock_preset:livestock,
          p_crop_preset:crop,
          p_max_event_reveals:maxReveals,
          p_board_assignment_mode:boardMode,
          p_powers_enabled:powersEnabled
        });
        for(let i=0;i<botConfigs.length;i++){
          const cfg=botConfigs[i];
          const focused=cfg.type==="focused";
          await rpc("farm_roll_add_bot_v1",{
            p_game_id:data.game_id,
            p_display_name:`${focused?"Focused":"Random"} Bot ${i+1}`,
            p_strategy:cfg.type,
            p_livestock_preset:boardMode==="asymmetric_chosen" && cfg.livestock!=="__auto__" ? cfg.livestock : null,
            p_crop_preset:boardMode==="asymmetric_chosen" && cfg.crop!=="__auto__" ? cfg.crop : null
          });
        }
        rememberRoom(data,name);
        ui.isHost=true;
        if(botCount){
          const focusedN=botConfigs.filter(x=>x.type==="focused").length;
          const randomN=botCount-focusedN;
          const parts=[];
          if(focusedN) parts.push(`${focusedN} Focused`);
          if(randomN) parts.push(`${randomN} Random`);
          ui.message=`Table opened with ${botCount} bot${botCount===1?"":"s"} (${parts.join(", ")}).`;
        }
        ui.screen="room";
        await refreshRoom(false);
        startPolling();
      }catch(e){
        if(rpcMissingError(e)) throw new Error("This client needs the Farm Roll v0.8.0 room functions on Supabase. The current server does not expose them yet.");
        throw e;
      }
    });
  }

  async function joinGame(){
    const name=$("#joinName")?.value.trim();
    const code=($("#joinCode")?.value||"").toUpperCase().replace(/[^A-Z0-9]/g,"").slice(0,5);
    const livestock=$("#joinLivestock")?.value||"Standard";
    const crop=$("#joinCrop")?.value||"Standard";
    if(!name){ statusMsg("Enter your name.",true); return; }
    if(code.length!==5){ statusMsg("Enter the five-character room code.",true); return; }
    await busy(async()=>{
      try{
        const data=await rpc("farm_roll_join_game_v66",{p_room_code:code,p_display_name:name,p_livestock_preset:livestock,p_crop_preset:crop});
        rememberRoom(data,name);
        ui.isHost=!!data.is_host;
        ui.screen="room";
        await refreshRoom(false);
        startPolling();
      }catch(e){
        if(rpcMissingError(e)) throw new Error("This client needs the Farm Roll v0.6.6 room functions on Supabase. The current server does not expose them yet.");
        throw e;
      }
    });
  }

  function rememberRoom(data,name){
    ui.gameId=data.game_id; ui.playerId=data.player_id; ui.roomCode=data.room_code;
    ui.playerName=name; ui.server=null; ui.editor=newEditor(); ui.fenceDraft=[]; ui.fenceRow=1; ui.butcherDraft={key:"",choices:{}}; ui.vanityDraft={left:null,right:null}; ui.drawDraft={}; ui.message="";
    saveLocal();
  }

  function isInteractiveElement(el){
    return !!el && ["SELECT","INPUT","TEXTAREA"].includes(el.tagName);
  }

  function backgroundInteractionActive(){
    return railInteractionDepth>0 || Date.now() < interactionHoldUntil || isInteractiveElement(document.activeElement);
  }

  function holdBackgroundRender(ms=1200){
    interactionHoldUntil = Math.max(interactionHoldUntil, Date.now()+ms);
  }

  function captureScrollMemory(){
    document.querySelectorAll("[data-scroll-key]").forEach(el=>{
      scrollMemory[el.dataset.scrollKey]=el.scrollLeft;
    });
  }

  function restoreScrollMemory(){
    const restore=()=>document.querySelectorAll("[data-scroll-key]").forEach(el=>{
      const v=scrollMemory[el.dataset.scrollKey];
      if(Number.isFinite(v) && Math.abs(el.scrollLeft-v)>.5){
        el.style.scrollBehavior="auto";
        el.scrollLeft=v;
      }
    });
    requestAnimationFrame(()=>requestAnimationFrame(restore));
    [80,180,360,650].forEach(ms=>setTimeout(restore,ms));
  }

  function beginRailInteraction(){
    clearTimeout(railReleaseTimer);
    railInteractionDepth=Math.max(1,railInteractionDepth+1);
    holdBackgroundRender(60000);
  }
  function endRailInteraction(){
    railInteractionDepth=0;
    interactionHoldUntil=Date.now()+700;
    clearTimeout(railReleaseTimer);
    railReleaseTimer=setTimeout(()=>{ interactionHoldUntil=Date.now(); flushBackgroundRender(); },760);
  }

  function backgroundRender(){
    if(backgroundInteractionActive()){
      backgroundRenderPending=true;
      return;
    }
    backgroundRenderPending=false;
    render();
  }

  function flushBackgroundRender(){
    if(backgroundRenderPending && !backgroundInteractionActive()){
      backgroundRenderPending=false;
      render();
    }
  }

  async function fetchRoomState(){
    try{return await rpc("farm_roll_get_state_v70",{p_game_id:ui.gameId});}
    catch(e){if(!rpcMissingError(e))throw e;return await rpc("farm_roll_get_state",{p_game_id:ui.gameId});}
  }
  async function fetchPowerState(data){
    if(!data?.game?.powers_enabled) return null;
    try{return await rpc("farm_roll_power_state_v2",{p_game_id:ui.gameId});}
    catch(e){if(!rpcMissingError(e))throw e;try{return await rpc("farm_roll_power_state_v1",{p_game_id:ui.gameId});}catch{return null;}}
  }

  async function advanceBotsForHost(data){
    if(autoBotsRunning || !data?.me?.is_host) return data;
    const bots=(data?.players||[]).filter(p=>p.is_bot);
    if(!bots.length || ["lobby","resolution","game_over"].includes(data?.game?.phase)) return data;
    autoBotsRunning=true;
    try{
      try{
        await rpc("farm_roll_host_run_bots_v2",{p_game_id:ui.gameId});
      }catch(e){
        if(!rpcMissingError(e)) throw e;
        await rpc("farm_roll_host_run_random_bots_v1",{p_game_id:ui.gameId});
      }
      return await fetchRoomState();
    }catch(e){
      if(rpcMissingError(e)) return data;
      throw e;
    }finally{ autoBotsRunning=false; }
  }

  async function refreshRoom(showBusy=false){
    if(!ui.gameId||!sb) return;
    const fn=async()=>{
      let data=await fetchRoomState();
      if(data?.game?.phase==="event_resolution" && !data?.game?.event_waiting){
        await rpc("farm_roll_run_event_engine",{p_game_id:ui.gameId});
        data=await fetchRoomState();
      }
      data=await advanceBotsForHost(data);
      ui.powerState=await fetchPowerState(data);
      const previousRound=ui.server?.game?.round_number;
      const previousPhase=ui.server?.game?.phase;
      ui.server=data;
      ui.isHost=!!data.me?.is_host;
      ui.roomCode=data.game.room_code;
      if(previousRound && previousRound!==data.game.round_number){ ui.editor=newEditor(); ui.playChoices=[]; ui.fenceDraft=[]; }
      if(previousPhase && previousPhase!==data.game.phase){ ui.playChoices=[]; ui.drawDraft={}; ui.initiativeCards=[]; ui.workspaceView="play"; }
      if(data.my_submission) ui.editor.actions=data.my_submission.actions||[];
      saveLocal();

      // Speed rule: if exactly one Play Cards obligation can be satisfied and
      // exactly one card is available, there is no decision for the player.
      if(data?.game?.phase==="play_cards" && !data?.me?.play_done && !autoPlaySubmitting){
        const pending=(data?.me?.play_track||[]).map((v,i)=>Number(v)===1?i+1:null).filter(Boolean);
        const hand=(data?.me?.hand_cards||[]).map(Number);
        const executable=Math.min(pending.length,hand.length);
        if(executable===1 && hand.length===1){
          autoPlaySubmitting=true;
          try{
            await rpc("farm_roll_submit_play_cards",{p_game_id:ui.gameId,p_card_numbers:[hand[0]]});
            data=await fetchRoomState();
            ui.server=data;
            ui.powerState=await fetchPowerState(data);
          } finally { autoPlaySubmitting=false; }
        }
      }
      saveLocal();
    };
    if(showBusy) await busy(fn); else {
      try{
        await fn();
        backgroundRender();
      }catch(e){
        const msg=friendly(e);
        if(/failed to fetch|networkerror|load failed/i.test(msg)) return;
        ui.message="ERR:"+msg;
        saveLocal();
        backgroundRender();
      }
    }
  }
  function startPolling(){
    clearInterval(pollTimer);
    pollTimer=setInterval(()=>{ if(ui.screen==="room"&&!ui.busy) refreshRoom(false); },POLL_MS);
  }
  function stopPolling(){clearInterval(pollTimer);pollTimer=null;}

  async function hostRoll(){
    await busy(async()=>{
      await rpc("farm_roll_roll_round",{p_game_id:ui.gameId});
      ui.editor=newEditor();
      await refreshRoom(false);
    });
  }

  async function submitActions(){
    if(ui.editor.actions.length!==3) return;
    await busy(async()=>{
      const result=await rpc("farm_roll_submit_turn",{p_game_id:ui.gameId,p_actions:ui.editor.actions,p_fences:ui.fenceDraft||[]});
      ui.fenceDraft=[];
      const fee=Number(result?.first_resource_fee||0);
      ui.message=`Committed • spent $${Number(result?.total_cost||0)}${fee?` (${fee} first-resource fee)`:""} • $${Number(result?.cash_remaining??cashOnHand())} remaining`;
      await refreshRoom(false);
    });
  }
  async function drawFromFace(face){
    await busy(async()=>{
      const result=await rpc("farm_roll_draw_facedown",{p_game_id:ui.gameId,p_face:Number(face)});
      const c=cardByNumber(result?.card_number);
      ui.message=c?`Drew #${displayCardNumber(c)} ${c.title}`:"Card drawn.";
      await refreshRoom(false);
    });
  }

  async function submitPlayCards(){
    const obligations=playExecutableIndexes();
    const choices=(ui.playChoices||[]).slice(0,obligations.length).map(Number);
    if(choices.length!==obligations.length || choices.some(x=>!x) || new Set(choices).size!==choices.length){
      statusMsg("Choose one different card for every Play Cards space you can satisfy.",true); return;
    }
    await busy(async()=>{
      const result=await rpc("farm_roll_submit_play_cards",{p_game_id:ui.gameId,p_card_numbers:choices});
      ui.playChoices=[];
      ui.message=result?.bonus_vp?`Play Cards complete. +${result.bonus_vp} VP from 🏚️.`:"Play Cards committed.";
      await refreshRoom(false);
    });
  }

  async function mayorChoose(cardNumber,position){
    await busy(async()=>{
      await rpc("farm_roll_mayor_choose_public",{p_game_id:ui.gameId,p_public_card_number:Number(cardNumber),p_position:position});
      await refreshRoom(false);
    });
  }

  async function eventReady(){
    await busy(async()=>{
      await rpc("farm_roll_event_ready",{p_game_id:ui.gameId});
      await refreshRoom(false);
    });
  }

  async function runEventEngine(){
    await busy(async()=>{
      await rpc("farm_roll_run_event_engine",{p_game_id:ui.gameId});
      await refreshRoom(false);
    });
  }

  async function submitCalamity(resourceId=null){
    await busy(async()=>{
      await rpc("farm_roll_submit_calamity_choice",{p_game_id:ui.gameId,p_resource_id:resourceId===null?null:Number(resourceId)});
      await rpc("farm_roll_run_event_engine",{p_game_id:ui.gameId});
      await refreshRoom(false);
    });
  }

  async function submitButcher(){
    const butcher=ui.server?.me?.butcher||{};
    const actions=Array.isArray(butcher.actions)?butcher.actions:[];
    const draft=ensureButcherDraft();
    const choices=actions.map(a=>{
      const d=draft.choices?.[a.species]||{};
      return {species:a.species,male:Number(d.male||0),female:Number(d.female||0),output:d.output||"Meat"};
    });
    await busy(async()=>{
      await rpc("farm_roll_submit_butcher_choice",{p_game_id:ui.gameId,p_choices:choices});
      ui.butcherDraft={key:"",choices:{}};
      await rpc("farm_roll_run_event_engine",{p_game_id:ui.gameId});
      await refreshRoom(false);
    });
  }

  async function submitVanity(leftCard=null,rightCard=null){
    await busy(async()=>{
      await rpc("farm_roll_submit_vanity_choice",{p_game_id:ui.gameId,p_left_card:leftCard===null?null:Number(leftCard),p_right_card:rightCard===null?null:Number(rightCard)});
      ui.vanityDraft={left:null,right:null};
      await rpc("farm_roll_run_event_engine",{p_game_id:ui.gameId});
      await refreshRoom(false);
    });
  }

  function setVanityDraft(dir,value){
    if(!ui.vanityDraft) ui.vanityDraft={left:null,right:null};
    ui.vanityDraft[dir]=value?Number(value):null;
    if(ui.vanityDraft.left && ui.vanityDraft.right && ui.vanityDraft.left===ui.vanityDraft.right){
      ui.vanityDraft[dir==="left"?"right":"left"]=null;
    }
    saveLocal(); render();
  }

  function ensureButcherDraft(){
    const b=ui.server?.me?.butcher||{};
    const key=`${Number(b.card_number||0)}:${Number(b.section_index||0)}`;
    if(!ui.butcherDraft||ui.butcherDraft.key!==key){
      const choices={};
      for(const a of (b.actions||[])) choices[a.species]={male:0,female:0,output:"Meat"};
      ui.butcherDraft={key,choices};
      saveLocal();
    }
    return ui.butcherDraft;
  }

  function changeButcherCount(species,sex,delta){
    const b=ui.server?.me?.butcher||{}, action=(b.actions||[]).find(a=>a.species===species);
    if(!action||ui.server?.me?.butcher_choice_done) return;
    const draft=ensureButcherDraft(), d=draft.choices[species]||{male:0,female:0,output:"Meat"};
    const max=Number(sex==="male"?action.male_owned:action.female_owned)||0;
    d[sex]=Math.max(0,Math.min(max,Number(d[sex]||0)+Number(delta||0)));
    draft.choices[species]=d; saveLocal(); render();
  }

  function setButcherOutput(species,output){
    const b=ui.server?.me?.butcher||{}, action=(b.actions||[]).find(a=>a.species===species);
    if(!action||ui.server?.me?.butcher_choice_done) return;
    if(output==="Clothes"&&!Object.prototype.hasOwnProperty.call(action,"clothes_qty")) return;
    const draft=ensureButcherDraft(), d=draft.choices[species]||{male:0,female:0,output:"Meat"};
    d.output=output; draft.choices[species]=d; saveLocal(); render();
  }

  async function skipDeferredSection(){
    await busy(async()=>{
      await rpc("farm_roll_skip_deferred_event_section",{p_game_id:ui.gameId});
      await rpc("farm_roll_run_event_engine",{p_game_id:ui.gameId});
      await refreshRoom(false);
    });
  }

  async function nextRound(){
    await busy(async()=>{
      await rpc("farm_roll_next_round",{p_game_id:ui.gameId});
      ui.editor=newEditor();
      await refreshRoom(false);
    });
  }

  async function busy(fn){
    ui.busy=true; ui.message=""; render();
    try{ await fn(); }
    catch(e){ ui.message="ERR:"+friendly(e); }
    finally{ ui.busy=false; saveLocal(); render(); }
  }

  function friendly(e){
    return String(e?.message||e||"Unknown error").replace(/^.*?message:\s*/i,"");
  }

  function sharedDice(){
    const r=ui.server?.game?.shared_roll||null;
    return DICE_DEF.map(d=>({...d,value:r?Number(r[d.id]):null}));
  }
  function selectedDice(){ return sharedDice().filter(d=>ui.editor.selected.includes(d.id)&&!ui.editor.used.includes(d.id)); }
  function selectedSum(){ return selectedDice().reduce((s,d)=>s+(d.value||0),0); }
  function selectedCost(){ return selectedDice().reduce((sum,d)=>sum+dieCost(d),0); }
  function hasPower(effectKey){
    return (ui.powerState?.my_powers||[]).some(p=>String(p.effect_key||"")===String(effectKey));
  }
  function resourceDiceLimit(){ return hasPower("workaholic")?6:3; }
  function committedTarget(){ return Math.max(1,Math.min(18,Number(ui.editor.committedTarget||1))); }
  function effectiveResourceTarget(){
    const sum=selectedSum();
    return hasPower("committed")&&sum>=19?committedTarget():sum;
  }
  function validSelection(type){
    const ds=selectedDice();
    if(ds.length<1||ds.length>resourceDiceLimit()) return false;
    if(!hasPower("flexible")){
      if(type==="crop"&&ds.some(d=>d.type==="livestock")) return false;
      if(type==="livestock"&&ds.some(d=>d.type==="crop")) return false;
    }
    const raw=selectedSum(), target=effectiveResourceTarget();
    if(raw>18&&!hasPower("committed")) return false;
    return target>=1&&target<=18&&resourceSpaceAvailable(type,target);
  }

  function toggleDie(id){
    if(ui.server?.my_submission||ui.busy) return;
    if(ui.editor.used.includes(id)) return;
    if(ui.editor.selected.includes(id)) ui.editor.selected=ui.editor.selected.filter(x=>x!==id);
    else if(ui.editor.selected.length<resourceDiceLimit()) ui.editor.selected.push(id);
    saveLocal(); render();
  }
  function chooseType(t){
    ui.editor.actionType=t;
    if(t==="house"||t==="blacktrack") ui.editor.selected=[];
    saveLocal();render();
  }
  function addAction(){
    if(ui.editor.actions.length>=3||ui.server?.my_submission) return;
    let a=null;
    if(ui.editor.actionType==="house"){
      const idx=nextPlayIndex();
      if(!idx) return;
      const typ=playTypeAt(idx), icon=PLAY_ICON[typ];
      a={type:"house",playIndex:idx,houseType:typ,title:`${icon} Play Cards #${idx}`,detail:`Circle next ${playTypeName(typ)} space • zero dice`};
    }else if(ui.editor.actionType==="blacktrack"){
      a={type:"blacktrack",face:ui.editor.blackFace,title:"⬛ Black track prep",detail:`Circle face ${ui.editor.blackFace} • zero dice`};
    }else{
      if(!validSelection(ui.editor.actionType)) return;
      const ds=selectedDice(), raw=selectedSum(), target=effectiveResourceTarget(), cost=selectedCost();
      a={type:ui.editor.actionType,diceIds:ds.map(d=>d.id),target,cost,
        title:ui.editor.actionType==="livestock"?`🐄 Livestock ${target}`:`🌱 Crop ${target}`,
        detail:`${ds.map(shortDie).join(" + ")}${raw>=19&&target!==raw?` → ${target} (Committed)`:""}${cost?` • cost: $${cost}`:" • free dice"}`};
      ui.editor.used.push(...a.diceIds); ui.editor.selected=[];
    }
    ui.editor.actions.push(a);saveLocal();render();
  }
  function undo(){
    if(ui.server?.my_submission) return;
    const a=ui.editor.actions.pop(); if(!a)return;
    if(a.diceIds) ui.editor.used=ui.editor.used.filter(x=>!a.diceIds.includes(x));
    saveLocal();render();
  }
  function shortDie(d){
    if(d.type==="white") return `${d.id.toUpperCase()}:${d.value}`;
    if(d.type==="black") return `B:${d.value}`;
    if(d.type==="livestock") return `L8:${d.value}`;
    return `C8:${d.value}`;
  }
  function resetToHome(message="") {
    stopPolling();
    ui=freshLocal();
    ui.message=message;
    saveLocal();
    try{
      const url=new URL(window.location.href);
      url.search="";url.hash="";
      history.replaceState({},"",url.toString());
    }catch{}
    render();
  }
  function leaveLocal(){
    if(!confirm("Exit this room on this browser? The server game and your seat will remain until the host deletes the game.")) return;
    resetToHome();
  }
  async function deleteCurrentGame(){
    if(!ui.gameId || !ui.isHost) return;
    const code=String(ui.roomCode||"");
    if(!confirm(`Permanently delete Farm Roll room ${code}? This removes the game and all of its saved room data for everyone.`)) return;
    ui.busy=true; render();
    try{
      await rpc("farm_roll_delete_game_v1",{p_game_id:ui.gameId});
      resetToHome(`Deleted room ${code}.`);
    }catch(e){
      ui.busy=false;
      statusMsg(friendly(e),true);
    }
  }
  async function copyInvite(){
    const url=inviteUrl();
    const text=`Join my Farm Roll game. Room code: ${ui.roomCode}`;
    if(navigator.share){
      try{await navigator.share({title:"Farm Roll",text,url});statusMsg("Invite shared.");return;}
      catch(e){if(e?.name==="AbortError") return;}
    }
    const fallback=`${text}\n${url}`;
    try{await navigator.clipboard.writeText(fallback);statusMsg("Invite link copied.");}
    catch{statusMsg(`${text} • ${url}`);}
  }

  function phaseLabel(){
    const p=ui.server?.game?.phase;
    if(p==="lobby") return "👥 Lobby";
    if(p==="choose_actions") return "✏️ Choose 3";
    if(p==="play_cards") return "🏠 Play Cards";
    if(p==="mayor_choice") return "👑 Mayor";
    if(p==="event_resolution") return "⚡ Events";
    if(p==="draw_cards") return "🃏 Draw Cards";
    if(p==="power_selection") return "⚡ Powers";
    if(p==="resolution") return "✅ Round done";
    if(p==="game_over") return "🏆 Game Over";
    return p||"Loading";
  }

  function render(){
    const app=$("#app"); if(!app)return;
    captureScrollMemory();
    if(!configured()) app.innerHTML=setupView();
    else if(ui.screen==="room"&&ui.gameId) app.innerHTML=roomView();
    else app.innerHTML=homeView();
    bind();
    restoreScrollMemory();
  }

  function setupView(){
    return `<div class="shell">
      <section class="hero"><div class="eyebrow">Online rooms • v${VERSION}</div><h1>FARM ROLL</h1><p class="subtitle">The six-deck multiplayer client is ready; this copy still needs its Supabase project connection.</p></section>
      <section class="card">
        <h2>Connect the room server</h2>
        <div class="note warning">Open <strong>config.js</strong> and paste your Supabase Project URL and Publishable key. Then deploy this folder to an HTTPS host.</div>
        <p class="small">Also run <strong>supabase/schema.sql</strong> once in the Supabase SQL editor and enable Anonymous Sign-Ins. Full steps are in SETUP_ROOMS.md.</p>
      </section>
      <div class="footer">Farm Roll Online v${VERSION} • Board set V2 • Bot engine Focused v3</div>
    </div>`;
  }

  function presetLabel(preset,side=""){
    const short=presetShortLabel(preset);
    if(short==="Standard") return "Standard";
    const entry=boardCatalogEntry(preset);
    const family=entry ? (String(entry.value).includes("BOTV2I")?"Intermediate":"Base") : (String(preset).startsWith("I")?"Intermediate":"Base");
    return `${side?side+" ":""}${short} • ${family}`;
  }
  function presetOptions(list,selected,side=""){
    return list.map(x=>`<option value="${x}" ${x===selected?"selected":""}>${esc(presetLabel(x,side))}</option>`).join("");
  }
  function botPresetOptions(family,selected="__auto__"){
    const allowed=FAMILY_PRESETS[family]||FAMILY_PRESETS.base;
    const opts=[`<option value="__auto__" ${selected==="__auto__"?"selected":""}>Auto Select</option>`];
    for(const x of allowed){
      opts.push(`<option value="${x}" ${x===selected?"selected":""}>${esc(presetLabel(x))}</option>`);
    }
    return opts.join("");
  }

  function readBotConfigs(){
    const rows=[...document.querySelectorAll("[data-bot-config]")];
    return rows.map(row=>({
      type:row.querySelector("[data-bot-type]")?.value||"random",
      livestock:row.querySelector("[data-bot-livestock]")?.value||"__auto__",
      crop:row.querySelector("[data-bot-crop]")?.value||"__auto__"
    }));
  }

  function syncBotConfigRows(){
    const host=$("#createBotConfigs");
    if(!host) return;
    const count=Math.max(0,Math.min(7,Number($("#createBotCount")?.value||0)));
    const family=$("#createDeckFamily")?.value||"base";
    const mode=$("#createBoardMode")?.value||"symmetric";
    const previous=readBotConfigs();
    const sharedLivestock=$("#createLivestock")?.value||((FAMILY_PRESETS[family]||[])[0]||"Standard");
    const sharedCrop=$("#createCrop")?.value||((FAMILY_PRESETS[family]||[])[0]||"Standard");
    const editable=mode==="asymmetric_chosen";
    const auto=mode==="asymmetric_auto";
    if(!count){
      host.innerHTML='<div class="tiny">No bots selected.</div>';
      return;
    }
    host.innerHTML=Array.from({length:count},(_,i)=>{
      const prev=previous[i]||{};
      const type=prev.type==="focused"?"focused":"random";
      let livestock=editable?(prev.livestock||"__auto__"):(auto?"__auto__":sharedLivestock);
      let crop=editable?(prev.crop||"__auto__"):(auto?"__auto__":sharedCrop);
      const allowed=new Set(FAMILY_PRESETS[family]||[]);
      if(livestock!=="__auto__"&&!allowed.has(livestock)) livestock="__auto__";
      if(crop!=="__auto__"&&!allowed.has(crop)) crop="__auto__";
      return `<section class="bot-config-row" data-bot-config="${i+1}">
        <div class="bot-config-head"><strong>🤖 Bot ${i+1}</strong><span class="tiny">${editable?"independent board":"board follows table mode"}</span>${i?`<button type="button" class="ghost bot-copy" data-copy-bot="${i}">Copy previous</button>`:""}</div>
        <div class="bot-config-grid">
          <label>Bot type<select data-bot-type><option value="random" ${type==="random"?"selected":""}>Random</option><option value="focused" ${type==="focused"?"selected":""}>Focused</option></select></label>
          <label>Livestock<select data-bot-livestock ${editable?"":"disabled"}>${botPresetOptions(family,livestock)}</select></label>
          <label>Crops<select data-bot-crop ${editable?"":"disabled"}>${botPresetOptions(family,crop)}</select></label>
        </div>
      </section>`;
    }).join("");
  }

  function syncCreateSetupControls(){
    const family=$("#createDeckFamily")?.value||"base";
    const mode=$("#createBoardMode")?.value||"symmetric";
    const l=$("#createLivestock"), c=$("#createCrop"), wrap=$("#createLayoutControls"), note=$("#createBoardModeNote");
    if(!l||!c) return;
    const allowed=FAMILY_PRESETS[family]||[];
    const fallback=allowed[0]||"Standard";
    const refill=(el,side)=>{
      const old=el.value;
      const chosen=allowed.includes(old)?old:(allowed.includes(fallback)?fallback:allowed[0]);
      el.innerHTML=presetOptions(allowed,chosen,side);
      el.value=chosen;
    };
    refill(l,"Livestock"); refill(c,"Crop");
    const auto=mode==="asymmetric_auto";
    l.disabled=auto; c.disabled=auto;
    wrap?.classList.toggle("setup-auto",auto);
    if(note){
      if(mode==="symmetric") note.innerHTML=`Everyone uses the same two layouts. ${family==="base"?"Choose Standard or B01–B30.":"Choose I01–I30."}`;
      else if(mode==="asymmetric_chosen") note.innerHTML=`Each player chooses livestock and crop independently from the ${family==="base"?"Base V2":"Intermediate V2"} board set.`;
      else note.innerHTML=family==="base"?"Each player is auto-assigned from Standard + B01–B30.":"Each player is auto-assigned from I01–I30.";
    }
    syncBotConfigRows();
  }

  function homeView(){
    const allJoin=presetOptions(ALL_PRESET_OPTIONS,"Standard");
    return `<div class="shell">
      <section class="hero"><div class="eyebrow">Online rooms • v${VERSION}</div><h1>FARM ROLL</h1><p class="subtitle">Choose the deck family, board assignment rules, livestock/crop layouts, and optional Event Reveal cap before opening the table.</p></section>
      ${messageBlock()}
      <section class="card">
        <h2>Table setup</h2>
        <div class="grid">
          <label>Your name<input id="createName" placeholder="Michael" value="${esc(ui.playerName)}"></label>
          <div class="grid two">
            <label>Deck Type<select id="createDeckFamily"><option value="base" selected>Deck 1 — Base Game</option><option value="intermediate">Deck 2 — Intermediate</option></select></label>
            <label>Board mode<select id="createBoardMode"><option value="symmetric" selected>Symmetric — shared layouts</option><option value="asymmetric_chosen">Asymmetric — players choose</option><option value="asymmetric_auto">Asymmetric — auto select</option></select></label>
          </div>
          <div id="createLayoutControls" class="grid two">
            <label>Livestock layout<select id="createLivestock">${presetOptions(FAMILY_PRESETS.base,"Standard","Livestock")}</select></label>
            <label>Crop layout<select id="createCrop">${presetOptions(FAMILY_PRESETS.base,"Standard","Crop")}</select></label>
          </div>
          <div id="createBoardModeNote" class="note setup-note">Everyone uses the same two layouts. Base tables use Standard + B01–B30.</div>
          <label>Bots <span class="tiny">0–7 • 8 total seats max</span><select id="createBotCount">${[0,1,2,3,4,5,6,7].map(n=>`<option value="${n}">${n===0?"None":`${n} bot${n===1?"":"s"}`}</option>`).join("")}</select></label>
          <div id="createBotConfigs" class="bot-config-list"><div class="tiny">No bots selected.</div></div>
          <div class="note setup-note"><strong>Random</strong> bots choose random legal decisions. <strong>Focused</strong> bots use a different hidden 2–7 animal-pair / 3–12 crop profile, rotate completed rows, and use strategic Butcher choices. Choose <strong>Asymmetric — players choose</strong> to set each bot's livestock and crop board independently; Symmetric and Auto Select follow the table's board mode.</div>
          <label>Powers <span class="tiny">v0.8.5 active-Power playtest</span><select id="createPowers"><option value="on" selected>ON — active-only 5-card Power River</option><option value="off">OFF — classic rules</option></select></label>
          <div class="note warning setup-note"><strong>Power playtest:</strong> acquisition, initiative ordering, Power Hungry, Fortune Teller, and Planner are live. Other Power cards are visible with their locked rules but are still marked as engine-pending in this build.</div>
          <label>Maximum Event Reveals <span class="tiny">optional • blank = normal game</span><input id="createMaxReveals" inputmode="numeric" pattern="[0-9]*" min="1" step="1" placeholder="e.g. 7"></label>
          <button id="createBtn" class="primary" ${ui.busy?"disabled":""}>${ui.busy?"Opening…":"OPEN TABLE"}</button>
        </div>
        <div class="divider">or join</div>
        <div class="grid two">
          <label>Your name<input id="joinName" placeholder="Hannah"></label>
          <label>Room code<input id="joinCode" maxlength="5" placeholder="F8K2P" value="${esc(inviteRoomCode())}" style="text-transform:uppercase"></label>
        </div>
        <div class="grid two" style="margin-top:10px">
          <label>My livestock layout<select id="joinLivestock">${allJoin}</select></label>
          <label>My crop layout<select id="joinCrop">${allJoin}</select></label>
        </div>
        <div class="note" style="margin-top:10px">Your two layout choices are used only when the host opened an <strong>Asymmetric — players choose</strong> table. Symmetric and auto-select rooms ignore them.</div>
        <button id="joinBtn" class="secondary" style="width:100%;margin-top:10px" ${ui.busy?"disabled":""}>Join table</button>
      </section>
      <div class="footer">Anonymous browser identity • Farm Roll Online v${VERSION} • Board set V2 • Bot engine Focused v3</div>
    </div>`;
  }

  function currentDeckFamily(){
    const family=String(ui.server?.game?.deck_family||"intermediate").toLowerCase();
    return family==="base"?"base":"intermediate";
  }
  function deckOrder(){ return DECK_ORDERS[currentDeckFamily()]||DECK_ORDERS.intermediate; }
  function deckHelpers(){ return currentDeckFamily()==="base"?BASE_DECK_HELPERS:INTERMEDIATE_DECK_HELPERS; }
  function deckMeta(theme){ return deckHelpers()?.[theme]||INTERMEDIATE_DECK_HELPERS?.[theme]||BASE_DECK_HELPERS?.[theme]||{}; }
  function deckFamilyLabel(family=currentDeckFamily()){ return family==="base"?"Deck 1 — Base Game":"Deck 2 — Intermediate"; }
  function boardModeLabel(mode){
    if(mode==="asymmetric_chosen") return "Asymmetric — players choose";
    if(mode==="asymmetric_auto") return "Asymmetric — auto select";
    return "Symmetric — shared layouts";
  }
  function normalizeDeckTheme(value){
    if(value&&typeof value==="object") value=value.deck_name||value.theme||value.name||value.deck;
    const raw=String(value||"").trim().toLowerCase();
    return ALL_DECK_THEMES.find(x=>x.toLowerCase()===raw)||null;
  }

  function deckSlots(){
    const g=ui.server?.game||{};
    if(Array.isArray(g.deck_slots)&&g.deck_slots.length){
      return g.deck_slots.map((x,i)=>{
        const theme=normalizeDeckTheme(x);
        const meta=deckMeta(theme);
        const remaining=Number(x?.remaining ?? x?.count ?? x?.cards_remaining);
        return {slot:Number(x?.slot||x?.face||i+1),theme,emoji:x?.emoji||meta.emoji||"🂠",remaining:Number.isFinite(remaining)?remaining:null,initial:Number(x?.initial_count||meta.initial_count||0)};
      }).filter(x=>x.slot>=1&&x.slot<=6).sort((a,b)=>a.slot-b.slot);
    }
    const mapping=g.deck_mapping||g.themed_deck_mapping||g.deck_map||null;
    if(!mapping) return [];
    const counts=g.deck_counts||g.deck_remaining_by_slot||g.themed_deck_counts||{};
    return [1,2,3,4,5,6].map(slot=>{
      const raw=Array.isArray(mapping)?mapping[slot-1]:(mapping[String(slot)]??mapping[slot]);
      const theme=normalizeDeckTheme(raw);
      const meta=deckMeta(theme);
      let cv=Array.isArray(counts)?counts[slot-1]:(counts[String(slot)]??counts[slot]??counts[theme]);
      const remaining=Number(cv);
      return {slot,theme,emoji:meta.emoji||"🂠",remaining:Number.isFinite(remaining)?remaining:null,initial:Number(meta.initial_count||0)};
    }).filter(x=>x.theme);
  }
  function deckSlot(face){ return deckSlots().find(x=>Number(x.slot)===Number(face))||null; }

  function deckHelperRows(theme){
    const h=deckMeta(theme); if(!h||!Object.keys(h).length) return "";
    return `<div class="helper-rows">
      <div class="helper-row"><span>Animal Harvest</span><strong>${h.animal_harvest||"—"}</strong></div>
      <div class="helper-row"><span>Crop Harvest</span><strong>${h.crop_harvest||"—"}</strong></div>
      <div class="helper-row"><span>Breeding</span><strong>${h.breeding||"—"}</strong></div>
      <div class="helper-macro">${h.macro||""}</div>
      <div class="helper-row"><span>Butcher</span><strong>${h.butcher||"—"}</strong></div>
      <div class="helper-row"><span>Market</span><strong>${h.market||"—"}</strong></div>
      <div class="helper-row"><span>Calamity / conditions</span><strong>${h.calamity||"—"}</strong></div>
    </div>`;
  }

  function deckStripPanel(){
    const slots=deckSlots();
    if(!slots.length){
      return `<section class="card deck-strip-card"><div class="topbar"><div><h2 style="margin:0">🂠 Six themed Draw Decks</h2><div class="tiny">The current client expects the room server to provide its six themed deck columns.</div></div><span class="phase-pill">v${VERSION}</span></div><div class="note warning">The live room server has not supplied the six-deck mapping yet. Refresh the room if its themed deck mapping has not loaded yet.</div></section>`;
    }
    const open=slots.find(x=>Number(x.slot)===Number(ui.openDeckSlot));
    return `<section class="card deck-strip-card">
      <div class="topbar"><div><h2 style="margin:0">🂠 Themed Draw Decks</h2><div class="tiny">Randomly assigned once • mapping stays fixed • tap a deck for its true helper</div></div><span class="phase-pill">${slots.reduce((n,x)=>n+(Number.isFinite(x.remaining)?x.remaining:0),0)} LEFT</span></div>
      <div class="deck-strip">${slots.map(x=>`<button class="deck-slot ${Number(ui.openDeckSlot)===x.slot?"active":""}" data-deck-slot="${x.slot}"><span class="deck-slot-num">${x.slot}</span><span class="deck-slot-emoji">${x.emoji}</span><span class="deck-slot-count">${Number.isFinite(x.remaining)?x.remaining:"—"}</span><small>${esc(x.theme||"")}</small></button>`).join("")}</div>
      ${open?`<div class="deck-helper-expanded"><div class="deck-helper-head"><span class="deck-helper-icon">${open.emoji}</span><div><strong>Deck ${open.slot} • ${esc(open.theme)}</strong><div class="tiny">${Number.isFinite(open.remaining)?`${open.remaining} cards remaining • `:""}most common → least common</div></div></div>${deckHelperRows(open.theme)}</div>`:""}
      <div class="tiny deck-rule-note">Initial public objectives draw from columns <strong>3 → 2 → 1</strong>. Later refills prefer the round’s black-die face, then fall forward to the lowest-numbered deck that can supply the request.</div>
    </section>`;
  }

  function eventRevealBanner(){
    const g=ui.server?.game||{}, me=ui.server?.me||{};
    const max=Number(g.max_event_reveals||g.event_reveal_limit||0);
    if(!max) return "";
    const count=Math.max(0,Number(g.event_reveal_count||g.event_reveals_completed||0));
    const remaining=Math.max(0,Number(g.event_reveals_remaining??(max-count)));
    const finalActive=!!(g.final_event_reveal||g.final_reveal_active||(remaining===0&&g.phase==="event_resolution"));
    const waitingAck=!!(g.final_reveal_waiting_ack||g.awaiting_final_reveal_ack);
    const acked=!!(me.final_reveal_acknowledged||me.final_event_acknowledged);
    if(waitingAck){
      return `<div class="reveal-limit-banner final"><strong>🏁 FINAL EVENT COMPLETE</strong><span>The game ended after reveal ${Math.min(count,max)} / ${max}.</span>${acked?`<b>✅ Acknowledged</b>`:`<button id="finalRevealAckBtn" class="ghost">Acknowledge</button>`}</div>`;
    }
    return `<div class="reveal-limit-banner ${finalActive?"final":""}"><strong>${finalActive?"⚠️ FINAL EVENT REVEAL":"⚡ EVENT REVEALS"}</strong><span>${Math.min(count,max)} / ${max} complete • ${remaining} remaining</span></div>`;
  }

  async function ackFinalReveal(){
    await busy(async()=>{
      await rpc("farm_roll_ack_final_event_v65",{p_game_id:ui.gameId});
      await refreshRoom(false);
    });
  }

  function tableSetupSummary(){
    const g=ui.server?.game||{}, me=ui.server?.me||{};
    const family=String(g.deck_family||"intermediate").toLowerCase()==="base"?"base":"intermediate";
    const mode=g.board_assignment_mode||"symmetric";
    const l=mode==="symmetric"?(g.livestock_preset||me.livestock_preset||me.board_preset||"Standard"):(me.livestock_preset||me.board_preset||g.livestock_preset||"Standard");
    const c=mode==="symmetric"?(g.crop_preset||me.crop_preset||me.board_preset||"Standard"):(me.crop_preset||me.board_preset||g.crop_preset||"Standard");
    const max=Number(g.max_event_reveals||g.event_reveal_limit||0);
    return `<div class="table-setup-summary"><span>🃏 <strong>${esc(deckFamilyLabel(family))}</strong></span><span>🧩 <strong>${esc(boardModeLabel(mode))}</strong></span><span>🐄 Livestock: <strong>${esc(presetShortLabel(l))}</strong></span><span>🌱 Crops: <strong>${esc(presetShortLabel(c))}</strong></span><span>⚡ Powers: <strong>${g.powers_enabled?"ON":"OFF"}</strong></span><span>🎴 Reveal cap: <strong>${max||"Normal"}</strong></span></div>`;
  }

  function handThemeCounts(p){
    const raw=p?.hand_theme_counts||p?.hand_themes||p?.card_back_counts||null;
    if(raw&&typeof raw==="object"&&!Array.isArray(raw)) return raw;
    if(Array.isArray(raw)){
      const out={}; raw.forEach(x=>{const t=normalizeDeckTheme(x);if(t)out[t]=(out[t]||0)+1;}); return out;
    }
    if(p?.id===ui.server?.me?.id){
      const out={}; handCards().forEach(c=>{if(c?.deck_name)out[c.deck_name]=(out[c.deck_name]||0)+1;}); return out;
    }
    return {};
  }
  function handThemeBadges(p){
    const counts=handThemeCounts(p), parts=deckOrder().filter(x=>Number(counts[x]||0)>0).map(x=>`<span class="hand-theme-back">${deckMeta(x)?.emoji||"🂠"}${Number(counts[x])>1?`×${Number(counts[x])}`:""}</span>`);
    return parts.length?`<span class="hand-theme-strip" title="Public card backs/themes">${parts.join("")}</span>`:"";
  }

  function playerBoardLabel(p){
    const g=ui.server?.game||{};
    const l=p?.livestock_preset||g.livestock_preset||p?.board_preset||"Standard";
    const c=p?.crop_preset||g.crop_preset||p?.board_preset||"Standard";
    return `🐄 ${esc(presetShortLabel(l))} • 🌱 ${esc(presetShortLabel(c))}`;
  }

  function liveFarmSnapshot(p){ return p?.public_farm||p?.farm_view||p?.board_snapshot||null; }
  function liveFarmResourceIds(side,p,snap){
    const g=ui.server?.game||{};
    const direct=side==="livestock"?(snap?.livestock_ids||p?.livestock_ids):(snap?.crop_ids||p?.crop_ids);
    if(Array.isArray(direct)&&direct.length===18) return direct.map(Number);
    const preset=side==="livestock"?(snap?.livestock_preset||p?.livestock_preset||g.livestock_preset||p?.board_preset||"Standard"):(snap?.crop_preset||p?.crop_preset||g.crop_preset||p?.board_preset||"Standard");
    const map=BOARD_MAPS[preset];
    if(map&&Array.isArray(map[side])&&map[side].length===18) return map[side];
    return preset==="Standard"?BOARD_MAPS.Standard[side]:[];
  }
  function liveFarmRows(side,p,snap){
    if(Array.isArray(snap?.row_scores)) return snap.row_scores.filter(x=>x.side===side).map(finalRowAudit).join("");
    const b=snap?.board_state||snap||{}, counts=(side==="livestock"?b.livestock_counts:b.crop_counts)||[], xed=(side==="livestock"?b.livestock_xed:b.crop_xed)||[], ids=liveFarmResourceIds(side,p,snap);
    return ids.map((id,i)=>{
      const r=RESOURCES[id]||{name:`Resource ${id}`,icon:"•"}, live=Number(counts[i]||0), xx=Number(xed[i]||0), occupied=live+xx, cap=SLOT_CAPS[i], points=currentRowScore(i+1,occupied), marker=points===7?"🪨":points===i+1?"🌲":"—";
      const profit=Number(snap?.resource_profit?.[String(id)]||0), enabled=Number(snap?.resource_enabled_profit?.[String(id)]||0);
      return `<div class="row-audit-item"><span>${side==="livestock"?"🐄":"🌱"} ${i+1} • ${r.icon} ${esc(r.name)}</span><span>${occupied}/${cap} (${live} live + ${xx} X)<small>💰 $${profit}${enabled?` • 🐝 Enabled +$${enabled}`:""}</small></span><strong>${marker} ${points} VP</strong></div>`;
    }).join("");
  }
  function liveTrackSummary(snap){
    const b=snap?.board_state||snap||{}, draw=b.draw_track||snap?.draw_track||{}, play=snap?.play_track||b.play_track||[];
    const drawText=[1,2,3,4,5,6].map(f=>{const t=draw[String(f)]||{};return `${f}: ${Number(t.xed||0)}/${Number(t.capacity||0)} X${Number(t.circled||0)?` +${Number(t.circled)} owed`:""}`;}).join(" • ");
    const playDone=Array.isArray(play)?play.filter(x=>Number(x)===2).length:Number(snap?.play_completed||0), playPending=Array.isArray(play)?play.filter(x=>Number(x)===1).length:Number(snap?.play_pending||0);
    return `<div class="live-track-box"><strong>⬛ Draw track</strong><div class="tiny">${esc(drawText)}</div><strong>🏠 Play Cards</strong><div class="tiny">${playDone} completed • ${playPending} pending</div></div>`;
  }
  function liveFarmDetails(p){
    const pid=String(p.id||p.player_id||p.display_name||""), open=!!ui.liveFarmOpen?.[pid], snap=liveFarmSnapshot(p);
    return `<details class="live-player-farm" data-live-farm="${esc(pid)}" ${open?"open":""}><summary>View Farm ${open?"▲":"▼"}</summary>${snap?`<div class="live-farm-note">Last public farm state. Current-round choices stay hidden until <strong>both you and this player have committed</strong>.</div><div class="live-farm-section"><strong>🐄 Livestock</strong><div class="row-audit-list">${liveFarmRows("livestock",p,snap)}</div></div><div class="live-farm-section"><strong>🌱 Crops</strong><div class="row-audit-list">${liveFarmRows("crop",p,snap)}</div></div>${liveTrackSummary(snap)}`:`<div class="note warning">Farm viewing is available when the v0.6.6 server supplies public farm snapshots.</div>`}</details>`;
  }
  function playerListEntry(p,g){
    const sc=p.score||{}, isMe=String(p.id||"")===String(ui.server?.me?.id||"");
    const botBadge=p.is_bot?`<span class="host">🤖 ${String(p.bot_strategy||"").startsWith("focused")?"FOCUSED":String(p.bot_strategy||"").startsWith("random")?"RANDOM":"BOT"}</span>`:"";
    return `<div class="player player-v65"><div class="player-main"><div class="player-head"><strong>${esc(p.display_name)}</strong> ${botBadge} ${p.is_host?'<span class="host">HOST</span>':''}</div><div class="tiny">${playerBoardLabel(p)} • 💵 $${Number(p.cash??100)} • ⭐ ${Number(sc.total_vp||0)} VP • 🃏 ${Number(p.hand_count||0)}/${Number(p.hand_limit||5)} ${handThemeBadges(p)}</div><div class="tiny score-mini">Cash ${Number(sc.cash_vp||0)} • Rows ${Number(sc.row_vp||0)} • 🏚️ ${Number(sc.house_vp||0)}</div>${isMe?"":liveFarmDetails(p)}</div><div>${playerPhaseStatus(p,g)}</div></div>`;
  }

  function workspaceTabs(g,me){
    const active=ui.workspaceView||"play";
    const hand=Number(me?.hand_cards?.length??me?.hand_count??0), limit=Number(me?.hand_limit||5);
    const players=Number(ui.server?.players?.length||0);
    const tabs=[
      ["play","🎮","Play",phaseLabel().replace(/^\S+\s*/,"")],
      ["farm","🌾","Farm",ui.farmView==="tracks"?"Tracks":ui.farmView==="crop"?"Crops":"Livestock"],
      ["hand","🃏","Hand",`${hand}/${limit}`],
      ["table","📊","Table",`${players} player${players===1?"":"s"}`]
    ];
    return `<nav class="workspace-tabs" aria-label="Game workspace">${tabs.map(([key,icon,label,sub])=>`<button class="workspace-tab ${active===key?"active":""}" data-workspace="${key}" aria-pressed="${active===key?"true":"false"}"><span class="workspace-icon">${icon}</span><span>${label}<small>${esc(sub)}</small></span></button>`).join("")}</nav>`;
  }

  function playersPanel(){
    const g=ui.server?.game||{}, players=ui.server?.players||[];
    return `<section class="card players-card">
      <div class="section-head"><div><h2>Players</h2><div class="tiny">Live status, score, hand size, and public farm snapshots</div></div><span class="section-count">${players.length}</span></div>
      <div class="player-list">${players.map(p=>playerListEntry(p,g)).join("")}</div>
    </section>`;
  }

  function roomToolsPanel(){
    const deleteBtn=ui.isHost?`<button id="deleteGameBtn" class="danger" style="width:100%;margin-top:10px">Delete this game permanently</button>`:"";
    return `<section class="card room-tools-card"><h2>Room tools</h2><div class="grid two"><button class="ghost" id="copyBtn">Share invite</button><button class="ghost" id="refreshBtn">Refresh now</button></div><button id="leaveBtn" class="ghost" style="width:100%;margin-top:10px">Exit to menu on this browser</button>${deleteBtn}<div class="tiny" style="margin-top:8px">Exit only disconnects this browser. Host delete permanently removes the saved room for everyone.</div></section>`;
  }

  function playWorkspace(g,hasRoll,submitted){
    return `${g.phase==="game_over"?gameOverPanel():""}
      ${g.phase==="lobby" ? lobbyPanel() : ""}
      ${g.phase==="choose_actions" ? choosePanel(hasRoll,submitted) : ""}
      ${g.phase==="play_cards" ? actionRevealPanel()+playCardsPanel() : ""}
      ${g.phase==="mayor_choice" ? mayorChoicePanel() : ""}
      ${g.phase==="event_resolution" ? eventResolutionPanel() : ""}
      ${g.phase==="draw_cards" ? drawPhasePanel() : ""}
      ${g.phase==="power_selection" ? powerSelectionPanel() : ""}
      ${batchVisibilityPanel()}
      ${g.phase==="resolution" ? resolutionPanel() : ""}`;
  }

  function roomView(){
    if(!ui.server){
      return `<div class="shell game-shell"><section class="card center" style="margin-top:0"><div class="spinner"></div><h2>Loading room…</h2>${messageBlock()}</section></div>`;
    }
    const g=ui.server.game, me=ui.server.me;
    const hasRoll=!!g.shared_roll, submitted=!!ui.server.my_submission;
    const active=ui.workspaceView||"play";
    const score=me?.score||{};
    const hand=Array.isArray(me?.hand_cards)?me.hand_cards.length:Number(me?.hand_count||0);
    return `<div class="shell game-shell">
      <section class="game-header-card">
        <div class="game-header-main">
          <div><div class="tiny">ROOM <strong>${esc(g.room_code)}</strong> • ROUND ${Number(g.round_number||0)}</div><div class="game-player-name">${esc(me?.display_name||ui.playerName)}</div></div>
          <div class="phase-pill">${phaseLabel()}</div>
        </div>
        <div class="game-stat-strip">
          <div><span>💵</span><strong>$${Number(me?.cash??0)}</strong><small>Cash</small></div>
          <div><span>⭐</span><strong>${Number(score.total_vp||0)}</strong><small>VP</small></div>
          <div><span>🃏</span><strong>${hand}/${Number(me?.hand_limit||5)}</strong><small>Hand</small></div>
          <div><span>🏚️</span><strong>${Number(score.house_vp||0)}</strong><small>House VP</small></div>
        </div>
      </section>

      ${endgameBanner()}
      ${eventRevealBanner()}
      ${messageBlock()}
      ${workspaceTabs(g,me)}

      <main class="workspace ${active}">
        ${active==="play"?playWorkspace(g,hasRoll,submitted):""}
        ${active==="farm"?farmPanel():""}
        ${active==="hand"?cardsPanel():""}
        ${active==="table"?`${playersPanel()}${marketPanel()}${powerRiverPanel()}${deckStripPanel()}${roomToolsPanel()}`:""}
      </main>

      <div class="footer">Farm Roll Online v${VERSION} • Board set V2 • Bot engine Focused v3</div>
    </div>`;
  }

  function endgameBanner(){
    const g=ui.server?.game||{};
    if(g.phase==="game_over") return `<div class="endgame-banner game-over"><strong>🏆 GAME OVER</strong><span>Final scores are locked.</span></div>`;
    if(!g.endgame_triggered) return "";
    const n=Number(g.endgame_rounds_remaining||0);
    if(Number(g.round_number)===Number(g.endgame_trigger_round)){
      return `<div class="endgame-banner"><strong>🏁 ENDGAME TRIGGERED</strong><span>${n} final round${n===1?"":"s"} begin after this round.</span></div>`;
    }
    return `<div class="endgame-banner"><strong>🏁 FINAL ROUNDS</strong><span>${n} remaining</span></div>`;
  }

  function gameOverPanel(){
    const g=ui.server?.game||{}, results=Array.isArray(g.final_results)?g.final_results:[];
    const winner=results.find(r=>r.is_winner);
    const tied=results.filter(r=>r.tiebreak_card!==null&&r.tiebreak_card!==undefined);
    const ordered=results.slice().sort((a,b)=>(Number(b.is_winner)-Number(a.is_winner))||(Number(b.total_vp||0)-Number(a.total_vp||0))||(Number(a.seat||0)-Number(b.seat||0)));
    return `<section class="card final-results">
      <div class="winner-hero"><div class="winner-crown">🏆</div><div><div class="tiny">WINNER</div><h2>${esc(winner?.display_name||"Game complete")}</h2><div class="winner-points">${Number(winner?.total_vp||0)} VP</div></div></div>
      ${tied.length>1?`<div class="note tiebreak-note"><strong>Final Draw tiebreaker:</strong> ${tied.sort((a,b)=>Number(b.tiebreak_card)-Number(a.tiebreak_card)).map(r=>`${esc(r.display_name)} drew #${displayCardNumber(r.tiebreak_card)}`).join(" • ")}.</div>`:""}
      <div class="final-player-list">${ordered.map(finalPlayerResult).join("")}</div>
    </section>`;
  }

  function finalPlayerResult(r){
    const rows=Array.isArray(r.row_scores)?r.row_scores:[];
    const pid=String(r.player_id||r.seat||r.display_name||"");
    const playerOpen=ui.finalOpenPlayers?.[pid] ?? !!r.is_winner;
    const auditOpen=!!ui.finalAuditOpen?.[pid];
    const pb=r.power_vp_breakdown||{};
    const powerLabels={cages:"Cages",forester:"Forester",quarry_master:"Quarry Master",thanksgiving_tradition:"Thanksgiving",corn_subsidy:"Corn Subsidy",painter:"Painter"};
    const powerParts=Object.entries(powerLabels).map(([k,label])=>[label,Number(pb?.[k]||0)]).filter(([,vp])=>vp!==0);
    const powerDetail=powerParts.length?`<div class="tiny" style="margin-top:8px">⚡ ${powerParts.map(([label,vp])=>`${esc(label)} +${vp}`).join(" • ")}</div>`:"";
    return `<details class="final-player ${r.is_winner?"winner":""}" data-final-player="${esc(pid)}" ${playerOpen?"open":""}>
      <summary><span><strong>${r.is_winner?"🏆 ":""}${esc(r.display_name)}</strong><small>🐄 ${esc(presetShortLabel(r.livestock_preset||r.board_preset||"Standard"))} • 🌱 ${esc(presetShortLabel(r.crop_preset||r.board_preset||"Standard"))}</small></span><span class="final-total">${Number(r.total_vp||0)} VP</span></summary>
      <div class="score-breakdown"><div><strong>${Number(r.cash_vp||0)}</strong><span>Cash VP<br>$${Number(r.cash||0)}</span></div><div><strong>${Number(r.row_vp||0)}</strong><span>Row VP</span></div><div><strong>${Number(r.house_vp||0)}</strong><span>🏚️ VP</span></div><div><strong>${Number(r.power_vp||0)}</strong><span>Power VP</span></div></div>
      ${powerDetail}
      <details class="row-audit" data-final-audit="${esc(pid)}" ${auditOpen?"open":""}><summary>View all 36 resource rows</summary><div class="row-audit-list">${rows.map(finalRowAudit).join("")}</div></details>
    </details>`;
  }
  function finalRowAudit(x){
    const rr=RESOURCES[Number(x.resource_id)]||{name:`Resource ${x.resource_id}`,icon:"•"};
    const marker=x.marker==="tree"?"🌲":x.marker==="rock"?"🪨":"—";
    const profit=Number(x.profit||0), enabled=Number(x.enabled_profit||0);
    return `<div class="row-audit-item"><span>${x.side==="livestock"?"🐄":"🌱"} ${Number(x.row)} • ${rr.icon} ${esc(rr.name)}</span><span>${Number(x.occupied||0)}/${Number(x.capacity||0)} (${Number(x.living||0)} live + ${Number(x.xed||0)} X)<small>💰 $${profit}${enabled?` • 🐝 Enabled +$${enabled}`:""}</small></span><strong>${marker} ${Number(x.points||0)} VP</strong></div>`;
  }
  function lobbyPanel(){
    return `<section class="card center">
      <div class="big-icon">🌾</div><h2>Room is open — before Round 1</h2>
      <p class="small">Have the other players open this same deployed URL and enter room <strong>${esc(ui.roomCode)}</strong>. Each player starts with 1 private card drawn from the themed deck mapped to column 1. ${ui.server?.game?.powers_enabled?"⚡ Powers are ON for this table.":"Powers are OFF for this table."}</p>${tableSetupSummary()}
      ${ui.isHost?`<button class="primary" id="rollBtn" style="width:100%" ${ui.busy?"disabled":""}>🎲 Roll the shared dice</button>`:`<div class="note">Waiting for the host to roll the first round.</div>`}
    </section>`;
  }

  function choosePanel(hasRoll,submitted){
    if(!hasRoll) return `<section class="card"><div class="note">The round has no shared roll yet.</div></section>`;
    if(submitted) return `<section class="card center"><div class="big-icon">🔒</div><h2>Your actions are committed</h2><p class="small">Actions and new fences are permanent. They stay private until every player commits. Then all players see the three actions and learn whether event play is Solo or Cooperative before anyone chooses actual cards.</p></section>`;
    const dice=sharedDice(), ds=selectedDice(), sum=selectedSum(), cost=selectedCost();
    const type=ui.editor.actionType, diceType=type==="livestock"||type==="crop";
    const actionSpend=committedActionCost(), firstFee=estimatedFirstResourceFee(), fenceCount=(ui.fenceDraft||[]).length, fenceSpend=fenceDraftCost(), projected=actionSpend+firstFee+fenceSpend;
    const cash=cashOnHand(), canAfford=projected<=cash, planValid=queuedResourcesFit();
    const canAdd=ui.editor.actions.length<3 && ((type==="house"&&playTrackSpaceAvailable())||(type==="blacktrack"&&blackTrackSpaceAvailable(ui.editor.blackFace))||validSelection(type));
    return `
      <section class="card cash-card">
        <div class="cash-strip"><div><div class="tiny">CASH</div><div class="cash-big">$${cash}</div></div><div class="cash-projection"><div><strong>$${projected}</strong> committed spend</div><div class="tiny">$${actionSpend} dice • $${firstFee} first-resource fees • $${fenceSpend} fences${hasPower("efficient_fencing")?` (${fenceCount} segments)`:""}</div></div><div class="cash-after ${canAfford?"":"negative"}">$${cash-projected}<span>after commit</span></div></div>
        ${canAfford?"":`<div class="note error" style="margin-top:9px">You cannot spend more cash than you have. Remove an action or tentative fence.</div>`}
        ${planValid?"":`<div class="note error" style="margin-top:9px">One of your livestock actions no longer has a fully fenced blank cell. Restore the needed fencing or undo that action.</div>`}
      </section>
      <section class="card">
        <h2>🎲 Shared roll</h2>
        <div class="dice-grid">${dice.map(d=>`<button class="die ${d.type} ${ui.editor.selected.includes(d.id)?"selected":""} ${ui.editor.used.includes(d.id)?"used":""}" data-die="${d.id}" ${ui.editor.used.includes(d.id)?"disabled":""}><div class="value">${d.value}</div><div class="name">${dieLabel(d)}</div></button>`).join("")}</div>
        <div class="sum-box"><div><div class="tiny">SELECTED</div><div>${ds.length?ds.map(shortDie).join(" + "):"No dice selected"}</div></div><div style="text-align:right"><div class="tiny">COST ${cost?`$${cost}`:"$0"}</div><div class="sum-big">${ds.length?sum:"—"}</div></div></div>
      </section>
      <section class="card">
        <h2>Prepare action ${ui.editor.actions.length+1}</h2>
        <div class="segmented">
          <button class="choice ${type==="livestock"?"active":""}" data-type="livestock">🐄 Livestock</button>
          <button class="choice ${type==="crop"?"active":""}" data-type="crop">🌱 Crops</button>
          <button class="choice ${type==="house"?"active":""}" data-type="house">🏠 Play Cards</button>
          <button class="choice ${type==="blacktrack"?"active":""}" data-type="blacktrack">⬛ Black track</button>
        </div>
        ${type==="blacktrack"?`<div style="margin-top:12px"><div class="small">Choose face/column:</div><div class="face-row black-face-row" style="margin-top:7px">${[1,2,3,4,5,6].map(n=>blackFaceChoice(n)).join("")}</div></div>`:""}
        ${diceType&&sum>=19&&hasPower("committed")?`<label class="committed-target">⚡ Committed target row<select id="committedTargetSelect">${Array.from({length:18},(_,i)=>{const row=i+1,rid=resourceIds(type)[i],rr=RESOURCES[rid]||{};return `<option value="${row}" ${committedTarget()===row?"selected":""}>${row} • ${rr.icon||""} ${esc(rr.short||rr.name||"")}</option>`}).join("")}</select></label>`:""}
        <div class="note ${diceType&&ds.length&&!validSelection(type)?"warning":""}" style="margin-top:12px">${actionHint(type,ds,sum)}</div>
        <button id="addBtn" class="primary" style="width:100%;margin-top:12px" ${canAdd?"":"disabled"}>Add action</button>
      </section>
      <section class="card">
        <div class="topbar"><h2 style="margin:0">Your three actions</h2><button id="undoBtn" class="ghost" ${ui.editor.actions.length?"":"disabled"}>Undo last</button></div>
        <div class="action-slots">${[0,1,2].map(actionSlot).join("")}</div>
      </section>
      ${fenceCommitPanel()}
      <div class="commit"><button id="submitBtn" class="primary" ${ui.editor.actions.length===3&&!ui.busy&&canAfford&&planValid?"":"disabled"}>🔒 Commit 3 actions + ${fenceCount} fence${fenceCount===1?"":"s"} • $${projected}</button></div>`;
  }

  function revealedActionLabel(a,submission){
    if(a?.title) return String(a.title);
    const type=String(a?.type||"");
    if(type==="blacktrack") return `⬛ Draw face ${Number(a?.face||a?.target||0)||"?"}`;
    if(type==="house") return "🏠 Play Cards";
    if(type==="livestock"||type==="crop"){
      const target=Number(a?.target||0);
      const player=(ui.server?.players||[]).find(p=>
        (submission?.player_id && String(p.id)===String(submission.player_id)) ||
        String(p.display_name||"")===String(submission?.display_name||"")
      );
      const g=ui.server?.game||{};
      const preset=type==="livestock"?(player?.livestock_preset||g.livestock_preset||player?.board_preset||"Standard"):(player?.crop_preset||g.crop_preset||player?.board_preset||"Standard");
      const direct=type==="livestock"?player?.livestock_ids:player?.crop_ids;
      const ids=(Array.isArray(direct)&&direct.length===18)?direct:(BOARD_MAPS[preset]?.[type]||(preset==="Standard"?BOARD_MAPS.Standard[type]:[]));
      const rid=ids?.[target-1];
      const rr=RESOURCES[Number(rid)];
      const icon=type==="livestock"?"🐄":"🌱";
      return rr?`${icon} ${rr.short} (row ${target})`:`${icon} ${type==="livestock"?"Livestock":"Crop"} ${target||"?"}`;
    }
    return type||"Action";
  }

  function resolutionPanel(){
    const subs=ui.server.revealed_submissions||[];
    return `<section class="card center"><div class="big-icon">✅</div><h2>Round complete</h2><p class="small">The simultaneous actions, Play Cards, Event effects, and mandatory Draw Cards phase are complete. Unfulfilled Play/Draw circles stay pending for future rounds.</p>
      ${subs.length?`<div class="player-list" style="text-align:left;margin-top:12px">${subs.map(s=>`<div class="player"><div><strong>${esc(s.display_name)}</strong><div class="tiny">${(s.actions||[]).map(a=>esc(revealedActionLabel(a,s))).join(" • ")}</div></div><span>3 actions</span></div>`).join("")}</div>`:""}
      ${ui.isHost?`<button id="nextBtn" class="primary" style="width:100%;margin-top:12px">${ui.server?.game?.endgame_triggered?`Start next final round • ${Number(ui.server.game.endgame_rounds_remaining||0)} remaining`:"Start next round"}</button>`:`<div class="note" style="margin-top:12px">Waiting for the host to start the next round.</div>`}
    </section>`;
  }



  function allCards(){
    return Array.isArray(window.FARM_ROLL_CARDS)?window.FARM_ROLL_CARDS:[];
  }

  function cardByNumber(n){
    return allCards().find(c=>Number(c.card_number)===Number(n))||null;
  }
  function displayCardNumber(value){
    const c=value&&typeof value==="object"?value:cardByNumber(value);
    if(c) return Number(c.display_number||((c.deck_family==="base"||Number(c.card_number)>100)?Number(c.card_number)-100:c.card_number));
    const n=Number(value||0);
    return currentDeckFamily()==="base"&&n>100?n-100:n;
  }

  function handCards(){
    return (ui.server?.me?.hand_cards||[]).map(cardByNumber).filter(Boolean);
  }

  function publicCards(){
    return (ui.server?.game?.public_cards||[]).map(cardByNumber).filter(Boolean);
  }

  function cardSection(type,text){
    if(!type||!text)return "";
    const cls=String(type).toLowerCase();
    return `<div class="event-section ${esc(cls)}"><div class="section-label">${esc(type)}</div><div class="section-text">${esc(text)}</div></div>`;
  }

  function eventCard(card,compact=false){
    if(!card)return "";
    const theme=card.deck_name||"";
    const family=card.deck_family||(Number(card.card_number)>100?"base":"intermediate");
    const displayNumber=Number(card.display_number||((family==="base"&&Number(card.card_number)>100)?Number(card.card_number)-100:card.card_number));
    const emoji=card.deck_emoji||deckMeta(theme)?.emoji||"🂠";
    return `<article class="event-card ${compact?"compact":""}" data-card-theme="${esc(theme)}">
      <div class="event-card-head">
        <div class="event-title-line"><span class="event-deck-emoji" title="${esc(theme)} deck">${emoji}</span><div><strong>${esc(card.title)}</strong><div class="tiny">${esc(String(theme||"EVENT").toUpperCase())} • ${family==="base"?"BASE":"INTERMEDIATE"}</div></div></div>
        <div class="card-number">#${displayNumber}</div>
      </div>
      ${cardSection(card.section1_type,card.section1_text)}
      ${cardSection(card.section2_type,card.section2_text)}
      ${cardSection(card.section3_type,card.section3_text)}
    </article>`;
  }

  function eventQueueBacks(){
    const g=ui.server?.game||{};
    const raw=g.event_queue_backs||g.event_queue_public_view||g.event_queue_themes||[];
    if(!Array.isArray(raw)||!raw.length) return "";
    const chips=raw.map((x,i)=>{const theme=normalizeDeckTheme(x);const slot=Number(x?.deck_slot||x?.slot||x?.deck_face||0);const emoji=deckMeta(theme)?.emoji||"🂠";return `<span class="queue-back-chip" title="Queued hidden event ${i+1}">${slot?`<b>${slot}</b> `:""}${emoji} ${esc(theme||"Hidden")}</span>`;}).join("");
    return `<div class="queue-back-strip"><span class="tiny">Public card backs in queue:</span><div>${chips}</div></div>`;
  }

  function cardsPanel(){
    const me=ui.server?.me||{};
    const hand=handCards();
    const pub=publicCards();
    const limit=Number(me.hand_limit||5);
    const totalRemaining=deckSlots().reduce((n,x)=>n+(Number.isFinite(x.remaining)?x.remaining:0),0);
    return `<section class="card cards-card">
      <div class="topbar" style="align-items:center">
        <div><h2 style="margin:0">🃏 Cards</h2><div class="tiny">99-card ${currentDeckFamily()==="base"?"Base":"Intermediate"} deck • ${deckOrder().join(" / ")} • exact faces stay private in hand</div></div>
        <div class="hand-badge">${hand.length}/${limit}</div>
      </div>

      <div class="cards-heading"><strong>Your hand</strong><span class="tiny">PRIVATE FACES • public backs/themes</span></div>
      ${hand.length?`<div class="card-scroll" data-scroll-key="hand-cards">${hand.map(c=>eventCard(c)).join("")}</div>`:`<div class="note">No cards in hand.</div>`}

      <div class="cards-heading" style="margin-top:14px"><strong>Public objectives</strong><span class="tiny">3 oldest → 1 newest</span></div>
      ${pub.length?`<div class="card-scroll" data-scroll-key="public-cards">${pub.map((c,i)=>`<div class="public-objective-wrap"><div class="public-objective-label">OBJECTIVE ${Math.max(1,3-i)} ${i===0?"• OLDEST":i===2?"• NEWEST":""}</div>${eventCard(c,true)}</div>`).join("")}</div>`:`<div class="note warning">Public objectives initialize from deck columns 3, 2, then 1 in a fresh v0.6.6 room.</div>`}

      ${ui.server?.game?.powers_enabled?`<div class="cards-heading" style="margin-top:14px"><strong>⚡ Your Powers</strong><span class="tiny">${(ui.powerState?.my_powers||[]).length} owned</span></div>${(ui.powerState?.my_powers||[]).length?`<div class="owned-powers-inline">${(ui.powerState.my_powers||[]).map(p=>`<span><strong>${esc(p.name)}</strong><small>${esc(p.rules_text||"")}</small></span>`).join("")}</div>`:`<div class="note">No Powers owned yet.</div>`}`:""}

      <div class="deck-line"><span>🂠 Six Draw Decks</span><strong>${deckSlots().length?`${totalRemaining} total remaining`:`server upgrade pending`}</strong></div>
      <div class="deck-line"><span>🔒 Hidden Event Deck</span><strong>${Number(ui.server?.game?.event_queue_count||0)} queued</strong></div>
      ${eventQueueBacks()}
      <div class="tiny" style="margin-top:6px">Normal draws target the themed deck mapped to the chosen black-track face. Empty-deck fallback is handled by deck-number cohorts; hidden Event faces keep their public theme/card back.</div>
    </section>`;
  }

  function pendingDrawSlots(){
    const track=boardState().draw_track||{};
    const out=[];
    [1,2,3,4,5,6].forEach(face=>{
      const n=Number(track[String(face)]?.circled||0);
      for(let i=0;i<n;i++) out.push(face);
    });
    return out;
  }

  function drawNeed(){
    const me=ui.server?.me||{};
    if(Number.isFinite(Number(me.draw_needed))) return Math.max(0,Number(me.draw_needed));
    const room=Math.max(0,Number(me.hand_limit||5)-handCards().length);
    return Math.min(room,pendingDrawSlots().length);
  }

  function drawDraftCount(face){ return Number(ui.drawDraft?.[String(face)]||0); }
  function drawDraftTotal(){ return Object.values(ui.drawDraft||{}).reduce((a,b)=>a+Number(b||0),0); }
  function drawDraftFaces(){
    const faces=[];
    [1,2,3,4,5,6].forEach(f=>{for(let i=0;i<drawDraftCount(f);i++)faces.push(f);});
    return faces;
  }
  function drawCompletionFaces(){
    if(!ui.server?.game?.powers_enabled) return [];
    const track=boardState().draw_track||{}, faces=[];
    [1,2,3,4,5,6].forEach(f=>{
      const chosen=drawDraftCount(f), t=track[String(f)]||{};
      const x=Number(t.xed||0), cap=Number(t.capacity||([3,3,3,4,7,8][f-1]));
      if(chosen>0 && x<cap && x+chosen>=cap) faces.push(f);
    });
    return faces;
  }
  function initiativeCardsForDraft(){
    const claims=drawCompletionFaces().length, hand=handCards().map(c=>Number(c.card_number));
    const need=Math.min(claims,hand.length);
    if(need<=0) return [];
    if(need===hand.length) return hand.slice();
    return (ui.initiativeCards||[]).map(Number).filter(n=>hand.includes(n)).slice(0,need);
  }
  function toggleInitiativeCard(card){
    card=Number(card);
    const claims=drawCompletionFaces().length, hand=handCards().map(c=>Number(c.card_number));
    const need=Math.min(claims,hand.length);
    if(need<=0||need===hand.length) return;
    const cur=(ui.initiativeCards||[]).map(Number).filter(n=>hand.includes(n));
    const at=cur.indexOf(card);
    if(at>=0) cur.splice(at,1); else if(cur.length<need) cur.push(card);
    ui.initiativeCards=cur;saveLocal();render();
  }
  function drawPlanPowerValid(){
    if(!ui.server?.game?.powers_enabled) return true;
    const me=ui.server?.me||{}, claims=drawCompletionFaces().length, total=drawDraftTotal();
    return handCards().length+total-claims<=Number(me.hand_limit||5);
  }
  function changeDrawDraft(face,delta){
    face=Number(face); const pending=pendingDrawSlots().filter(x=>x===face).length, need=drawNeed();
    if(!ui.drawDraft) ui.drawDraft={};
    const cur=drawDraftCount(face), total=drawDraftTotal();
    const next=Math.max(0,Math.min(pending,cur+Number(delta||0),cur+Math.max(0,need-total)));
    ui.drawDraft[String(face)]=next; ui.initiativeCards=[]; saveLocal(); render();
  }

  async function submitDrawPlan(){
    const need=drawNeed(); if(drawDraftTotal()!==need||!drawPlanPowerValid()) return;
    const faces=drawDraftFaces(), initiatives=initiativeCardsForDraft();
    const initNeed=Math.min(drawCompletionFaces().length,handCards().length);
    if(initiatives.length!==initNeed) return;
    await busy(async()=>{
      await rpc("farm_roll_submit_draw_plan_v2",{p_game_id:ui.gameId,p_faces:faces,p_initiative_cards:initiatives});
      ui.drawDraft={}; ui.initiativeCards=[];
      await refreshRoom(false);
    });
  }

  function initiativePicker(){
    if(!ui.server?.game?.powers_enabled) return "";
    const faces=drawCompletionFaces(), hand=handCards(), need=Math.min(faces.length,hand.length);
    if(!faces.length) return "";
    const chosen=initiativeCardsForDraft();
    const missing=Math.max(0,faces.length-hand.length);
    const autoAll=need===hand.length;
    return `<div class="initiative-picker"><div class="power-mini-head"><strong>⚡ ${faces.length} Power claim${faces.length===1?"":"s"}</strong><span>Faces ${faces.join(", ")}</span></div>
      <div class="tiny">Initiative cards are discarded before normal draws. Lowest printed card number resolves first globally.</div>
      ${need?`<div class="tiny" style="margin-top:7px">${autoAll?`All ${need} card${need===1?"":"s"} in your hand must become initiative.`:`Choose ${need} initiative card${need===1?"":"s"}: ${chosen.length}/${need} selected.`}</div>`:""}
      ${!autoAll&&need?`<div class="initiative-choice-list">${hand.map(c=>{const n=Number(c.card_number),on=chosen.includes(n);return `<button class="initiative-chip ${on?"selected":""}" data-init-card="${n}">#${displayCardNumber(n)} ${esc(c.title||"Event")}</button>`}).join("")}</div>`:""}
      ${missing?`<div class="note warning" style="margin-top:8px">You owe ${missing} more initiative card${missing===1?"":"s"}. The earliest card${missing===1?"":"s"} you subsequently draw will automatically be discarded as initiative.</div>`:""}
    </div>`;
  }

  function drawPhasePanel(){
    const me=ui.server?.me||{}, g=ui.server?.game||{};
    const hand=handCards(), limit=Number(me.hand_limit||5), slots=pendingDrawSlots(), need=drawNeed();
    const remaining=Number(g.deck_remaining||0), done=!!me.draw_done, ready=!!me.draw_plan_ready;
    const pendingByFace=f=>slots.filter(x=>x===f).length;
    const claims=drawCompletionFaces().length, initNeed=Math.min(claims,hand.length), initHave=initiativeCardsForDraft().length;
    const valid=drawPlanPowerValid() && initHave===initNeed;

    if(done || g.phase!=="draw_cards") return `<section class="card center draw-phase-card"><div class="big-icon">✅</div><h2>Your Draw Cards phase is complete</h2><p class="small">Any circles you could not draw because of your hand limit remain pending for a future round.</p></section>`;

    if(ready){
      const waiters=(ui.server?.players||[]).filter(p=>!p.draw_plan_ready && !p.draw_done);
      return `<section class="card center draw-phase-card"><div class="big-icon">🃏</div><h2>Draw choices locked</h2><p class="small">The game handles the fair draw waves and Power initiative cards automatically.</p><div class="note">${waiters.length?`Waiting for ${waiters.map(p=>esc(p.display_name)).join(", ")} to choose their draw spaces.`:"Resolving everyone’s draws…"}</div></section>`;
    }

    return `<section class="card draw-phase-card">
      <div class="topbar" style="align-items:center"><div><h2 style="margin:0">🃏 Draw Cards</h2><div class="small">Hand ${hand.length}/${limit}${hand.length>limit?" (allowed overflow)":""} • choose ${need} X${need===1?"":"s"}</div></div><span class="phase-pill">MANDATORY</span></div>
      <div class="note">Choose which pending black-track spaces to X. Power-completing faces can free hand space through their mandatory initiative discard.</div>
      <div class="draw-plan-grid">${[1,2,3,4,5,6].filter(f=>pendingByFace(f)>0).map(face=>{const pending=pendingByFace(face),chosen=drawDraftCount(face),t=boardState().draw_track?.[String(face)]||{},left=Math.max(0,Number(t.capacity||0)-Number(t.xed||0));const slot=deckSlot(face);return `<div class="draw-plan-face"><div><strong>Face ${face}${slot?.theme?` • ${slot.emoji} ${esc(slot.theme)}`:""}</strong><small>${pending} pending • ${left} X${left===1?"":"s"} until FREE${Number.isFinite(slot?.remaining)?` • ${slot.remaining} cards`:""}</small></div><div class="draw-stepper"><button data-draw-plan-minus="${face}" ${chosen<=0?"disabled":""}>−</button><span>${chosen}</span><button data-draw-plan-plus="${face}" ${chosen>=pending||drawDraftTotal()>=need?"disabled":""}>+</button></div></div>`}).join("")}</div>
      ${drawDraftTotal()===need&&!drawPlanPowerValid()?`<div class="note error" style="margin-top:8px">At this hand size, your plan must include enough face completions to create the required initiative discards.</div>`:""}
      ${initiativePicker()}
      <button id="submitDrawPlanBtn" class="primary" style="width:100%;margin-top:10px" ${drawDraftTotal()===need&&valid&&!ui.busy?"":"disabled"}>Lock ${need} draw choice${need===1?"":"s"}</button>
      <div class="tiny" style="margin-top:9px">Draw Deck: ${remaining} card${remaining===1?"":"s"} remaining. Multiple completed faces resolve their associated draws in face order 1→6; Power initiatives later resolve by printed card number.</div>
    </section>`;
  }

  function powerRiverPanel(){
    const ps=ui.powerState||{};
    if(!ui.server?.game?.powers_enabled) return "";
    if(!ps.enabled) return `<section class="card power-river-card"><div class="note">Power data is unavailable for this table.</div></section>`;
    const river=Array.isArray(ps.market)?ps.market:[];
    const mine=Array.isArray(ps.my_powers)?ps.my_powers:[];
    return `<section class="card power-river-card">
      <div class="topbar"><div><h2 style="margin:0">⚡ Power River</h2><div class="tiny">Public face-up Powers • oldest → newest • $0 / $5 / $10 / $20 / $30</div></div><span class="phase-pill">PUBLIC</span></div>
      <div class="power-market-grid">${river.map(p=>{const cost=Number(p.cost??p.base_cost??0),active=String(p.engine_status)==="implemented"||String(p.engine_status)==="tested";return `<article class="power-card ${active?"implemented":"pending"}"><div class="power-card-head"><div><strong>${esc(p.name)}</strong><small>${active?"ENGINE ACTIVE":"RULE LOCKED • ENGINE PENDING"}</small></div><span>$${cost}</span></div><p>${esc(p.rules_text||"")}</p></article>`}).join("")||'<div class="note">The Power River is empty.</div>'}</div>
      <div class="power-owned-section">
        <div class="cards-heading"><strong>⚡ My Powers</strong><span class="tiny">${mine.length} owned</span></div>
        ${mine.length?`<div class="power-owned-grid">${mine.map(p=>{const active=String(p.engine_status)==="implemented"||String(p.engine_status)==="tested";return `<article class="power-owned-card"><strong>${esc(p.name)}</strong><small>${esc(p.rules_text||"")}</small><span>${active?"ENGINE ACTIVE":"ENGINE PENDING"} • Acquired for $${Number(p.acquisition_price||0)}</span></article>`}).join("")}</div>`:`<div class="note">No Powers owned yet.</div>`}
      </div>
    </section>`;
  }

  function powerSelectionPanel(){
    const ps=ui.powerState||{}, market=Array.isArray(ps.market)?ps.market:[], queue=Array.isArray(ps.queue)?ps.queue:[], cur=ps.current_claim||null;
    const me=ui.server?.me||{}, cash=Number(me.cash||0), mine=Array.isArray(ps.my_powers)?ps.my_powers:[];
    if(!ps.enabled) return `<section class="card"><div class="note">Powers are off for this table.</div></section>`;
    return `<section class="card power-phase-card">
      <div class="topbar"><div><h2 style="margin:0">⚡ Power River</h2><div class="tiny">Oldest → newest • $0 / $5 / $10 / $20 / $30 • river shifts after every claim</div></div><span class="phase-pill">${ps.my_turn?"YOUR CLAIM":"GLOBAL QUEUE"}</span></div>
      <div class="power-queue">${queue.map((q,i)=>`<span class="power-queue-chip ${i===0?"current":""}">#${Number(q.initiative_card_number||0)} ${esc(q.display_name)} • Face ${Number(q.source_face||0)}</span>`).join("")||'<span class="tiny">No unresolved claims.</span>'}</div>
      ${cur?`<div class="note ${ps.my_turn?"":"warning"}" style="margin-top:9px"><strong>#${Number(cur.initiative_card_number||0)}:</strong> ${ps.my_turn?"Choose one Power now.":`${esc(cur.display_name)} chooses next.`}</div>`:""}
      <div class="power-market-grid">${market.map(p=>{const cost=Number(p.cost??p.base_cost??0),active=String(p.engine_status)==="implemented"||String(p.engine_status)==="tested";return `<article class="power-card ${active?"implemented":"pending"}"><div class="power-card-head"><div><strong>${esc(p.name)}</strong><small>${active?"ENGINE ACTIVE":"RULE LOCKED • ENGINE PENDING"}</small></div><span>$${cost}</span></div><p>${esc(p.rules_text||"")}</p>${ps.my_turn?`<button class="${active?"primary":"secondary"}" data-power-pick="${Number(p.power_id)}" ${cash<cost?"disabled":""}>Take ${esc(p.name)} • $${cost}</button>`:""}</article>`}).join("")}</div>
      ${mine.length?`<div class="owned-powers"><strong>Your Powers</strong><div>${mine.map(p=>`<span>${esc(p.name)}${Number(p.acquisition_price)===0?" • $0":` • $${Number(p.acquisition_price)}`}</span>`).join("")}</div></div>`:""}
      <div class="note" style="margin-top:10px">v0.8.5 playtest: newly created Power games use only <strong>ENGINE ACTIVE</strong> cards in the River. Older rooms may still show previously dealt pending cards.</div>
    </section>`;
  }

  async function choosePower(powerId){
    await busy(async()=>{
      await rpc("farm_roll_choose_power_v1",{p_game_id:ui.gameId,p_power_id:Number(powerId)});
      await refreshRoom(false);
    });
  }

  function playerPhaseStatus(p,g){
    if(g.phase==="lobby") return "🟢 Joined";
    if(g.phase==="choose_actions") return p.committed?"✅ Committed":"⏳ Choosing";
    if(g.phase==="play_cards") return p.play_done?"✅ Play done":"🏠 Playing";
    if(g.phase==="mayor_choice") return p.id===g.mayor_player_id?"👑 Mayor choosing":"⏳ Waiting";
    if(g.phase==="event_resolution"){
      if(g.event_waiting==="calamity") return p.event_choice_done?"🔒 Calamity set":"⚠️ Choosing";
      if(g.event_waiting==="butcher") return p.butcher_choice_done?"🔒 Butcher set":"🔪 Choosing";
      if(g.event_waiting==="vanity") return p.vanity_choice_done?"🔒 Vanity set":"🪞 Choosing";
      if(g.event_waiting==="review") return p.event_ready?"✅ Events ready":"⚡ Reviewing";
      if(g.event_waiting&&String(g.event_waiting).includes("deferred")) return "⏸️ Deferred";
      return "⚡ Resolving";
    }
    if(g.phase==="draw_cards") return p.draw_done?"✅ Draw done":"🃏 Drawing";
    if(g.phase==="power_selection") return "⚡ Power queue";
    if(g.phase==="resolution") return "✅ Round done";
    if(g.phase==="game_over") return p.id===g.winner_player_id?"🏆 Winner":"🏁 Finished";
    return "⏳";
  }

  function playTrack(){
    const t=ui.server?.me?.play_track;
    return Array.isArray(t)&&t.length===36?t.map(Number):Array(36).fill(0);
  }
  function playTypeAt(index){ return PLAY_TRACK_TYPES[index-1]||"H"; }
  function playTypeName(t){
    if(t==="T") return "🏘️ REVEAL EVENTS";
    if(t==="D") return "🏚️ discard +3 VP";
    return "🏠 play event";
  }
  function queuedHouseCount(){ return ui.editor.actions.filter(a=>a.type==="house").length; }
  function playUsedCount(){ return playTrack().filter(x=>x!==0).length; }
  function nextPlayIndex(){
    const n=playUsedCount()+queuedHouseCount()+1;
    return n<=36?n:null;
  }
  function playTrackSpaceAvailable(){ return nextPlayIndex()!==null; }
  function pendingPlayIndexes(){ return playTrack().map((v,i)=>v===1?i+1:null).filter(Boolean); }
  function playExecutableIndexes(){ return pendingPlayIndexes().slice(0,handCards().length); }

  function setPlayChoice(slot,value){
    ui.playChoices=Array.isArray(ui.playChoices)?ui.playChoices:[];
    ui.playChoices[Number(slot)]=value?Number(value):null;
    saveLocal(); render();
  }

  function playTrackPanel(){
    const track=playTrack();
    const pending=track.filter(x=>x===1).length;
    const xed=track.filter(x=>x===2).length;
    let offset=0;
    const rows=PLAY_ROW_LENGTHS.map((len,row)=>{
      const html=Array.from({length:len},(_,j)=>{
        const idx=offset+j+1, typ=playTypeAt(idx), state=track[idx-1]||0;
        return `<div class="play-space ${state===1?"circled":state===2?"xed":"available"}" title="#${idx} ${playTypeName(typ)}">
          <span class="play-icon">${PLAY_ICON[typ]}</span><span class="play-mark">${state===1?"◉":state===2?"ⓧ":"○"}</span><span class="play-index">${idx}</span>
        </div>`;
      }).join("");
      offset+=len;
      return `<div class="play-track-row row-${row+1}">${html}</div>`;
    }).join("");
    return `<div class="play-track-box">
      <div class="track-summary"><div><strong>🏠 Play Cards track</strong><div class="tiny">${pending} circled obligation${pending===1?"":"s"} • ${xed} completed • 🏚️ ${Number(ui.server?.me?.score?.house_vp||0)} VP</div></div></div>
      <div class="play-track-rows" data-scroll-key="play-track">${rows}</div>
      <div class="tiny track-legend">◉ circled / owed &nbsp; ⓧ executed &nbsp; ○ available</div>
      <div class="note" style="margin-top:9px">Circling is only preparation. During Play Cards you must execute every pending space you can satisfy, starting with the earliest circled space. If you run out of cards, later circles remain pending for a future round.</div>
    </div>`;
  }

  function actionRevealPanel(){
    const revealed=ui.server?.revealed_submissions||[];
    const mode=String(ui.server?.game?.play_mode||ui.server?.play_mode||"");
    if(!revealed.length) return "";
    const label=mode==="cooperative"?"🤝 COOPERATIVE EVENT":mode==="solo"?"👤 SOLO EVENT":"NO EVENT CONTRIBUTORS";
    const sub=mode==="cooperative"?"2+ players can contribute events. Contributors choose cards now; that cooperative batch will be sorted lowest card number first.":mode==="solo"?"Only one player can contribute an event. That player's chosen event cards will enter in Play Cards/action order.":"No player can add an event card from the currently satisfiable obligations.";
    return `<section class="card action-reveal-card"><div class="topbar"><div><h2 style="margin:0">🔎 Actions revealed</h2><div class="tiny">Card identities were not chosen until after this reveal.</div></div><span class="phase-pill">${label}</span></div><div class="revealed-action-list">${revealed.map(r=>`<div class="revealed-player"><strong>${esc(r.display_name)}</strong><div>${(r.actions||[]).map((a,i)=>`<span><b>${i+1}</b> ${esc(a.title||a.type||"Action")}${a.detail?`<small>${esc(a.detail)}</small>`:""}</span>`).join("")}</div></div>`).join("")}</div><div class="note" style="margin-top:9px">${sub}</div></section>`;
  }

  function playCardsPanel(){
    const me=ui.server?.me||{};
    const g=ui.server?.game||{};
    const hand=handCards(), pending=pendingPlayIndexes(), exec=playExecutableIndexes();
    const mode=String(g.play_mode||ui.server?.play_mode||"");
    const contributorTypes=exec.map(playTypeAt).filter(t=>t==="H"||t==="T");
    const contributes=contributorTypes.length>0;
    const modeTitle=mode==="cooperative"?"🤝 COOPERATIVE":mode==="solo"?"👤 SOLO":"NO EVENT BATCH";
    const modeText=mode==="cooperative"?(contributes?"You are one of the cooperating event contributors. Choose after knowing the round is cooperative; after all contributors lock, only contributors see this batch and it is ordered lowest card number first.":"Other players are cooperating on events this round. You are not an event contributor, so their card identities remain hidden from you."):(mode==="solo"?(contributes?"You are the only event contributor. Assign your event cards to the obligations below; they enter the Event Deck in this obligation/action order, not numerical order.":"Another player is the sole event contributor. Their event-card identities remain hidden from you."):"Resolve any discard-house obligation normally; no event card is being added this round.");
    if(me.play_done){
      const waiters=(ui.server?.players||[]).filter(p=>!p.play_done);
      return `<section class="card center play-phase-card"><div class="big-icon">🔒</div><h2>Play Cards committed</h2><p class="small">${modeTitle}. Your card choices are locked while other players finish.</p>${waiters.length?`<div class="note">Waiting for ${waiters.map(p=>esc(p.display_name)).join(", ")}.</div>`:`<div class="note">All players are complete; building the event batch…</div>`}</section>`;
    }
    if(!pending.length||!hand.length){
      return `<section class="card center play-phase-card"><div class="big-icon">${hand.length?"✅":"🃏"}</div><h2>No Play Cards choice needed</h2><p class="small">${pending.length&&!hand.length?"You have pending houses but no cards, so they remain circled for a future Play Cards phase.":"You have no pending Play Cards circles."}</p><div class="note">${modeText}</div></section>`;
    }
    const leftovers=pending.length-exec.length;
    return `<section class="card play-phase-card">
      <div class="topbar" style="align-items:center"><div><h2 style="margin:0">🏠 Play Cards phase</h2><div class="small">${pending.length} pending • ${hand.length} card${hand.length===1?"":"s"} in hand</div></div><span class="phase-pill">${modeTitle}</span></div>
      <div class="note">${modeText}</div>
      <div class="play-obligations">${exec.map((idx,i)=>playObligationRow(idx,i,hand)).join("")}</div>
      ${leftovers>0?`<div class="note warning" style="margin-top:9px">You will have no cards left after these ${exec.length}; the remaining ${leftovers} Play Cards circle${leftovers===1?"":"s"} stay pending.</div>`:""}
      <button class="primary" id="submitPlayBtn" style="width:100%;margin-top:11px" ${playChoicesValid(exec.length)?"":"disabled"}>🔒 Commit Play Cards</button>
    </section>`;
  }
  function playObligationRow(idx,slot,hand){
    const typ=playTypeAt(idx), selected=Number((ui.playChoices||[])[slot]||0);
    const usedElsewhere=new Set((ui.playChoices||[]).map(Number).filter(Boolean).filter((_,i)=>i!==slot));
    const description=typ==="T"?"Play into hidden Event Deck; triggers Event Resolution":typ==="D"?"Discard; NOT added to Event Deck; gain +3 VP":"Play into hidden Event Deck";
    return `<div class="play-obligation"><div class="play-obligation-icon">${PLAY_ICON[typ]}</div><div><strong>Space #${idx}</strong><div class="tiny">${description}</div><select data-play-choice="${slot}"><option value="">Choose card…</option>${hand.map(c=>`<option value="${c.card_number}" ${selected===c.card_number?"selected":""} ${usedElsewhere.has(c.card_number)?"disabled":""}>#${displayCardNumber(c)} ${esc(c.title)}</option>`).join("")}</select></div></div>`;
  }

  function playChoicesValid(n){
    const c=(ui.playChoices||[]).slice(0,n).map(Number);
    return c.length===n&&c.every(Boolean)&&new Set(c).size===n;
  }

  function batchVisibilityPanel(){
    const g=ui.server?.game||{}, count=Number(ui.server?.play_batch_count||0), visible=ui.server?.play_batch_visible||[];
    if(g.phase==="play_cards"||count<=0||g.phase==="event_resolution") return "";
    const mode=String(g.play_mode||ui.server?.play_mode||"");
    if(visible.length){
      const coop=mode==="cooperative";
      return `<section class="card contributor-card"><div class="topbar"><div><h2 style="margin:0">${coop?"🤝 Cooperative contributor view":"👤 Solo contributor view"}</h2><div class="tiny">${coop?"Only players who contributed an event card to this cooperative batch see and remember these specific queued cards.":"Only you contributed event cards this round."}</div></div><span class="phase-pill">${coop?"LOW # FIRST":"ACTION ORDER"}</span></div><div class="note">${coop?"This batch is ordered by card number. Noncontributors remain in fog of war.":"Your event cards entered in Play Cards/action order."}</div><div class="card-scroll" data-scroll-key="contributor-cards" style="margin-top:9px">${visible.map(v=>{const c=cardByNumber(v.card_number);return `<div class="contribution-wrap"><div class="tiny contribution-owner">${esc(v.display_name)} • ${PLAY_ICON[v.house_type]} #${v.house_index}</div>${eventCard(c,true)}</div>`}).join("")}</div></section>`;
    }
    return `<section class="card"><div class="note">🔒 ${count} event card${count===1?" was":"s were"} added this round. You did not contribute an event card to that batch, so their identities remain hidden from you.</div></section>`;
  }
  function mayorChoicePanel(){
    const g=ui.server?.game||{}, me=ui.server?.me||{}, players=ui.server?.players||[];
    const mayor=players.find(p=>p.id===g.mayor_player_id);
    if(me.id!==g.mayor_player_id){
      return `<section class="card center"><div class="big-icon">👑</div><h2>${esc(mayor?.display_name||"Mayor")} is Mayor</h2><p class="small">Exactly one player executed 🏘️ this round. The Mayor privately chooses one of the three public cards and whether it resolves first or last. Everyone else waits; this is not a player turn.</p></section>`;
    }
    return `<section class="card mayor-card"><div class="topbar"><div><h2 style="margin:0">👑 You are Mayor</h2><div class="small">Choose 1 public event and its placement.</div></div><span class="phase-pill">SPECIAL CHOICE</span></div><div class="note">Choose any public card. It never enters your hand. Put it <strong>FIRST</strong> or <strong>LAST</strong> in this Event Resolution. The public row is then refilled from the themed deck mapped to this round’s black-die face; if that deck cannot supply the card, use the lowest-numbered available deck.</div><div class="mayor-grid">${publicCards().map(c=>`<div class="mayor-option">${eventCard(c,true)}<div class="grid two" style="padding:8px"><button class="primary" data-mayor-card="${c.card_number}" data-mayor-pos="first">Resolve FIRST</button><button class="secondary" data-mayor-card="${c.card_number}" data-mayor-pos="last">Resolve LAST</button></div></div>`).join("")}</div></section>`;
  }

  function hiddenEventCard(theme=null,slot=null){
    const meta=theme?deckMeta(theme):null;
    const emoji=meta?.emoji||"🔒";
    const label=theme?`${emoji} Hidden ${esc(theme)} Event`:"🔒 Hidden Event";
    return `<div class="event-card hidden-event-card ${theme?"themed-hidden":""}"><div class="hidden-lock">${emoji}</div><strong>${label}</strong><small>${slot?`Deck ${Number(slot)} • `:""}You know the card back/theme, not its face.</small></div>`;
  }

  function eventResolutionPanel(){
    const g=ui.server?.game||{}, me=ui.server?.me||{};
    const view=Array.isArray(g.event_resolution_view)&&g.event_resolution_view.length?g.event_resolution_view:(g.event_resolution_queue||[]).map((n,i)=>({position:i+1,card_number:n,hidden:!n,public:Number(n)===Number(g.selected_public_card||0),resolved:i+1<Number(g.event_card_pos||1),current:i+1===Number(g.event_card_pos||1)}));
    const waiting=g.event_waiting||null;
    return `<section class="card event-resolution-card">
      <div class="topbar"><div><h2 style="margin:0">⚡ Event Resolution</h2><div class="small">Exact faces stay hidden unless your player learned them; themed backs remain public.</div></div><span class="phase-pill">${view.length} EVENTS</span></div>
      <div class="note">Older queued cards stay ahead of later batches. Cooperative contributors remember the specific faces they saw together; noncontributors keep face-level fog of war, but everyone can see each hidden card’s theme/back. Public Mayor cards remain public.</div>
      <div class="resolution-list">${view.map(v=>{const n=Number(v.card_number||0);return `<div class="resolution-item ${v.resolved?"resolved-event":v.current?"current-event":""}"><div class="resolution-order">${Number(v.position||0)}</div><div class="resolution-card-wrap">${v.public?'<div class="public-tag">PUBLIC EVENT</div>':""}${v.hidden||!n?hiddenEventCard(v.deck_name||v.deck_theme||v.theme||null,v.deck_slot||v.deck_face||null):eventCard(cardByNumber(n),true)}</div></div>`}).join("")}</div>
      ${eventProgressPanel(waiting)}
      ${eventEffectsLog()}
      ${waiting==="review"?(me.event_ready?`<div class="note" style="margin-top:9px">✅ You reviewed the resolved effects. Waiting for the other players.</div>`:`<button class="primary" id="eventReadyBtn" style="width:100%;margin-top:11px">✅ Reviewed effects — ready for Draw Cards</button>`):""}
    </section>`;
  }
  function eventProgressPanel(waiting){
    const g=ui.server?.game||{}, queue=(g.event_resolution_queue||[]).map(x=>Number(x||0));
    if(waiting==="review") return `<div class="note" style="margin-top:11px"><strong>All supported sections resolved.</strong> Review the effect ledger below, then mark yourself ready.</div>`;
    if(waiting==="calamity") return calamityChoicePanel();
    if(waiting==="butcher") return butcherChoicePanel();
    if(waiting==="vanity") return vanityChoicePanel();
    if(waiting==="calamity_deferred"){
      const card=cardByNumber(queue[Math.max(0,Number(g.event_card_pos||1)-1)]);
      const section=Number(g.event_section_pos||1);
      return `<div class="deferred-panel"><strong>⏸️ VANITY intentionally deferred in v0.5B</strong><div class="deferred-text">#${card?displayCardNumber(card):"?"} ${esc(card?.title||"")} • section ${section}. This browser appears to be on an older client. Refresh to load v0.6 Vanity choices.</div>${ui.isHost?`<button id="skipDeferredBtn" class="secondary" style="width:100%;margin-top:9px">TEST ONLY — skip Vanity</button>`:`<div class="tiny" style="margin-top:7px">Waiting for the host to use the test skip.</div>`}</div>`;
    }
    const card=cardByNumber(queue[Math.max(0,Number(g.event_card_pos||1)-1)]);
    return `<div class="resolving-note"><span class="small-spinner"></span><div><strong>Resolving automatically…</strong><div class="tiny">${card?`#${displayCardNumber(card)} ${esc(card.title)} • section ${Number(g.event_section_pos||1)}`:"Advancing event engine"}</div></div><button id="resumeEventsBtn" class="ghost">Resume</button></div>`;
  }

  function calamityChoicePanel(){
    const cal=ui.server?.me?.calamity||{}, opts=(cal.options||[]).map(Number), submitted=!!cal.submitted;
    const card=cardByNumber(cal.card_number), code=String(cal.code||"CALAMITY").replaceAll("_"," ");
    if(submitted) return `<div class="deferred-panel"><strong>🔒 ${esc(code)} choice committed</strong><div class="deferred-text">Your choice stays private until every player commits this Calamity.</div></div>`;
    if(!opts.length) return `<div class="deferred-panel"><strong>⚠️ ${esc(code)}</strong><div class="deferred-text">This Calamity has no eligible target on your farm. You still must confirm no effect so all players resolve simultaneously.</div><button id="calamityNoEffectBtn" class="primary" style="width:100%;margin-top:9px">Confirm no effect</button></div>`;
    return `<div class="deferred-panel"><strong>⚠️ ${esc(code)} — choose privately</strong><div class="deferred-text">#${card?displayCardNumber(card):"?"} ${esc(card?.title||"")} • your choice is hidden until everyone commits.</div><div class="calamity-options">${opts.map(id=>{const r=RESOURCES[id]||{icon:"•",name:`Resource ${id}`};return `<button class="calamity-option" data-calamity-resource="${id}"><span>${r.icon}</span><strong>${esc(r.name)}</strong><small>${resourceCountById(id)} owned</small></button>`}).join("")}</div></div>`;
  }


  function vanityChoicePanel(){
    const v=ui.server?.me?.vanity||{}, submitted=!!v.submitted, hand=handCards();
    if(submitted) return `<div class="vanity-panel"><strong>🔒 Vanity locked</strong><div class="deferred-text">Your transfer is private until every player has locked their Vanity obligation.</div></div>`;
    const left=!!v.owed_left, right=!!v.owed_right;
    if(!left&&!right) return `<div class="vanity-panel"><strong>✨ Vanity: no obligation</strong><div class="deferred-text">You own a Horse and a traditional Vice resource.</div></div>`;
    if(!hand.length) return `<div class="vanity-panel"><strong>🪞 Vanity: no cards to give</strong><div class="deferred-text">The server automatically records no transfer because your hand is empty.</div></div>`;
    if(hand.length===1 && left && right){
      const c=hand[0];
      return `<div class="vanity-panel"><div class="butcher-head"><div><strong>🪞 Vanity</strong><div class="deferred-text">You owe one card LEFT for having no Horse and one RIGHT for having no Coffee/Tobacco/Tea, but you own only one card. Choose which obligation receives it.</div></div><span class="phase-pill">PRIVATE</span></div><div class="vanity-one-card">${eventCard(c,true)}<div class="grid two"><button class="primary" data-vanity-one="left">← Give LEFT to ${esc(v.left_player_name||"left player")}</button><button class="secondary" data-vanity-one="right">Give RIGHT to ${esc(v.right_player_name||"right player")} →</button></div></div></div>`;
    }
    const d=ui.vanityDraft||{left:null,right:null};
    const select=(dir,label,recipient)=>`<label>${label} • ${esc(recipient||"")}<select data-vanity-dir="${dir}"><option value="">Choose card…</option>${hand.map(c=>`<option value="${c.card_number}" ${Number(d[dir])===Number(c.card_number)?"selected":""} ${Number(d[dir==="left"?"right":"left"])===Number(c.card_number)?"disabled":""}>#${displayCardNumber(c)} ${esc(c.title)}</option>`).join("")}</select></label>`;
    const valid=(!left||Number(d.left))&&(!right||Number(d.right))&&(!left||!right||Number(d.left)!==Number(d.right));
    return `<div class="vanity-panel"><div class="butcher-head"><div><strong>🪞 Vanity</strong><div class="deferred-text">Choose every card you owe, then lock all transfers together. Transfers resolve simultaneously and may take a hand above 5.</div></div><span class="phase-pill">PRIVATE</span></div><div class="vanity-choices">${left?select("left","← No Horse: give LEFT",v.left_player_name):""}${right?select("right","No Coffee/Tobacco/Tea: give RIGHT →",v.right_player_name):""}</div><button class="primary" id="submitVanityBtn" style="width:100%;margin-top:10px" ${valid?"":"disabled"}>🔒 Lock Vanity transfer${left&&right?"s":""}</button></div>`;
  }

  function butcherChoicePanel(){
    const butcher=ui.server?.me?.butcher||{}, actions=Array.isArray(butcher.actions)?butcher.actions:[];
    const submitted=!!butcher.submitted||!!ui.server?.me?.butcher_choice_done;
    const card=cardByNumber(butcher.card_number), draft=ensureButcherDraft();
    if(submitted) return `<div class="deferred-panel"><strong>🔒 Butcher plan committed</strong><div class="deferred-text">Your complete slaughter plan is hidden until every player commits. Then all species and all players reveal and resolve together.</div></div>`;
    const totals=butcherDraftTotals(actions,draft);
    return `<div class="butcher-panel">
      <div class="butcher-head"><div><strong>🔪 BUTCHER — choose everything privately</strong><div class="deferred-text">#${card?displayCardNumber(card):"?"} ${esc(card?.title||"")} • section ${Number(butcher.section_index||1)}. Choose male/female counts for every species, plus Meat or Clothes where offered. Nothing resolves until you lock the whole section.</div></div><span class="phase-pill">SIMULTANEOUS</span></div>
      <div class="butcher-market-strip"><span>🥩 Meat: Step ${Number(ui.server?.game?.market_steps?.Meat||7)} ($${marketPrice("Meat",ui.server?.game?.market_steps?.Meat||7)})</span><span>👕 Clothes: Step ${Number(ui.server?.game?.market_steps?.Clothes||7)} ($${marketPrice("Clothes",ui.server?.game?.market_steps?.Clothes||7)})</span></div>
      <div class="butcher-options">${actions.map(a=>butcherSpeciesCard(a,draft)).join("")}</div>
      <div class="butcher-summary"><div><strong>${totals.animals}</strong><span>animals X'd</span></div><div><strong>+$${totals.cash}</strong><span>projected payout</span></div><div><strong>${totals.meatPressure}</strong><span>Meat pressure</span></div><div><strong>${totals.clothesPressure}</strong><span>Clothes pressure</span></div></div>
      <div class="tiny" style="margin-top:7px">Remainders are still slaughtered and still push the chosen market down even when they produce no extra unit. Each byproduct can drop at most 5 steps in this Butcher section.</div>
      <button id="submitButcherBtn" class="primary" style="width:100%;margin-top:11px">🔒 Lock all Butcher choices</button>
    </div>`;
  }

  function butcherSpeciesCard(a,draft){
    const d=draft.choices?.[a.species]||{male:0,female:0,output:"Meat"};
    const male=Number(d.male||0), female=Number(d.female||0), total=male+female;
    const dual=Object.prototype.hasOwnProperty.call(a,"clothes_qty");
    const output=dual&&d.output==="Clothes"?"Clothes":"Meat";
    const qty=Number(output==="Clothes"?a.clothes_qty:a.meat_qty), per=Number(output==="Clothes"?(a.clothes_per||1):a.meat_per);
    const units=Math.floor(total/Math.max(1,per))*qty, step=Number(ui.server?.game?.market_steps?.[output]||7), price=marketPrice(output,step), cash=units*price;
    const mr=RESOURCES[Number(a.male_id)]||{}, fr=RESOURCES[Number(a.female_id)]||{};
    const rateMeat=`${Number(a.meat_qty)} 🥩 per ${Number(a.meat_per)}`;
    const rateClothes=dual?`${Number(a.clothes_qty)} 👕 per ${Number(a.clothes_per||1)}`:"";
    return `<div class="butcher-species">
      <div class="butcher-species-title"><div><strong>${esc(a.species)}</strong><div class="tiny">${rateMeat}${dual?` / ${rateClothes}`:""}</div></div><div class="tiny">${total} selected</div></div>
      <div class="butcher-sex-grid">
        ${butcherStepper(a.species,"male",mr,Number(a.male_owned||0),male)}
        ${butcherStepper(a.species,"female",fr,Number(a.female_owned||0),female)}
      </div>
      ${dual?`<div class="butcher-output"><button class="${output==="Meat"?"active":""}" data-butcher-output="${esc(a.species)}" data-output="Meat">🥩 Meat</button><button class="${output==="Clothes"?"active":""}" data-butcher-output="${esc(a.species)}" data-output="Clothes">👕 Clothes</button></div>`:`<div class="tiny" style="margin-top:7px">🥩 Meat only</div>`}
      <div class="butcher-preview">${total?`${total} slaughtered → ${units} ${MARKET_META[output]?.icon||""} ${esc(output)} × $${price} = <strong>+$${cash}</strong> • market pressure −${Math.min(5,total)}${total%Math.max(1,per)?` • ${total%Math.max(1,per)} remainder slaughtered`:""}`:"No slaughter selected."}</div>
    </div>`;
  }

  function butcherStepper(species,sex,r,owned,value){
    return `<div class="butcher-stepper"><div><span class="resource-icon">${r.icon||"•"}</span><strong>${esc(r.short||r.name||sex)}</strong><div class="tiny">${owned} owned</div></div><div class="stepper-controls"><button data-butcher-species="${esc(species)}" data-butcher-sex="${sex}" data-delta="-1" ${value<=0?"disabled":""}>−</button><strong>${value}</strong><button data-butcher-species="${esc(species)}" data-butcher-sex="${sex}" data-delta="1" ${value>=owned?"disabled":""}>+</button></div></div>`;
  }

  function butcherDraftTotals(actions,draft){
    let animals=0,cash=0,meatPressure=0,clothesPressure=0;
    for(const a of actions){
      const d=draft.choices?.[a.species]||{}, total=Number(d.male||0)+Number(d.female||0);
      if(!total) continue;
      const output=Object.prototype.hasOwnProperty.call(a,"clothes_qty")&&d.output==="Clothes"?"Clothes":"Meat";
      const qty=Number(output==="Clothes"?a.clothes_qty:a.meat_qty), per=Number(output==="Clothes"?(a.clothes_per||1):a.meat_per);
      const units=Math.floor(total/Math.max(1,per))*qty;
      const step=Number(ui.server?.game?.market_steps?.[output]||7);
      cash+=units*marketPrice(output,step); animals+=total;
      if(output==="Clothes") clothesPressure+=total; else meatPressure+=total;
    }
    return {animals,cash,meatPressure,clothesPressure};
  }

  function eventEffectsLog(){
    const log=ui.server?.game?.event_log||[];
    if(!Array.isArray(log)||!log.length) return "";
    return `<div class="event-log"><div class="cards-heading"><strong>Effect ledger</strong><span class="tiny">server-applied</span></div><div class="event-log-list">${log.map(eventLogEntry).join("")}</div></div>`;
  }

  function eventLogEntry(e){
    const type=String(e?.type||"EVENT"), card=displayCardNumber(e?.card_number), sec=Number(e?.section_index||0);
    if(type==="MARKET") return `<div class="event-log-entry"><div class="event-log-head"><strong>#${card} • MARKET</strong><span>section ${sec}</span></div>${marketDiff(e.market_before,e.market_after)}</div>`;
    if(type==="HARVEST"){
      const payouts=(e.payouts||[]).map(x=>{
        const pieces=Object.entries(x.units||{}).filter(([,v])=>Number(v)>0).map(([k,v])=>{
          const step=Number(e.market_before?.[k]||7), price=marketPrice(k,step);
          return `${Number(v)} ${MARKET_META[k]?.icon||""} ${esc(marketDisplayName(k))} × $${price} = <strong>+$${Number(v)*price}</strong>`;
        });
        const bee=Array.isArray(x.details)?x.details.reduce((n,d)=>n+Number(d.bee_extra||0),0):0;
        return `${esc(x.display_name)}: ${pieces.length?pieces.join(" • "):"+$0"}${bee?` <span class="bee-note">(${bee} from 🐝)</span>`:""}`;
      }).join("<br>");
      const pressure=Object.entries(e.market_pressure||{}).filter(([,v])=>Number(v)>0).map(([k,v])=>`${MARKET_META[k]?.icon||""}${esc(marketDisplayName(k))} used ${Number(v)} resource${Number(v)===1?"":"s"} → drop ${Math.min(5,Number(v))}`).join(" • ");
      return `<div class="event-log-entry"><div class="event-log-head"><strong>#${card} • HARVEST</strong><span>section ${sec}</span></div><div>${payouts||"No production"}</div>${pressure?`<div class="tiny" style="margin-top:5px">${pressure}</div>`:""}${marketDiff(e.market_before,e.market_after)}</div>`;
    }
    if(type==="BUTCHER"){
      const players=(e.results||[]).map(r=>{
        const choices=(r.choices||[]).map(c=>{
          const mr=RESOURCES[Number(c.male_resource_id)]?.short||"♂", fr=RESOURCES[Number(c.female_resource_id)]?.short||"♀";
          return `${esc(c.species)}: X${Number(c.male||0)} ${esc(mr)} + X${Number(c.female||0)} ${esc(fr)} → ${Number(c.units||0)} ${MARKET_META[c.output]?.icon||""} ${esc(c.output)} × $${Number(c.price||0)} = <strong>+$${Number(c.cash||0)}</strong>`;
        });
        return `${esc(r.display_name)}: ${choices.length?choices.join(" • "):"No slaughter"}`;
      }).join("<br>");
      const pressure=Object.entries(e.pressure||{}).filter(([,v])=>Number(v)>0).map(([k,v])=>`${MARKET_META[k]?.icon||""}${esc(k)} pressure ${Number(v)} → drop ${Math.min(5,Number(v))}`).join(" • ");
      return `<div class="event-log-entry butcher-log"><div class="event-log-head"><strong>#${card} • BUTCHER</strong><span>section ${sec}</span></div><div>${players||"No slaughter"}</div>${pressure?`<div class="tiny" style="margin-top:5px">${pressure}</div>`:""}${marketDiff(e.market_before,e.market_after)}</div>`;
    }
    if(type==="BREEDING"){
      const gains=(e.gains||[]).map(x=>{const lo=RESOURCES[Number(x.lower_resource_id)]?.short||"lower";const hi=RESOURCES[Number(x.higher_resource_id)]?.short||"higher";const lost=Number(x.lost_lower||0)+Number(x.lost_higher||0);return `${esc(x.display_name)} — ${esc(x.species||"")}: +${Number(x.added_lower||0)} ${esc(lo)}, +${Number(x.added_higher||0)} ${esc(hi)}${lost?` • ${lost} lost (no fenced room)`:""}`}).join(" • ");
      return `<div class="event-log-entry"><div class="event-log-head"><strong>#${card} • BREEDING</strong><span>section ${sec}</span></div><div>${gains||"No offspring"}</div></div>`;
    }
    if(type==="VANITY") return `<div class="event-log-entry vanity-log"><div class="event-log-head"><strong>#${card} • VANITY</strong><span>simultaneous</span></div><div>${(e.results||[]).map(r=>`${esc(r.display_name)}: sent ${Number(r.sent_count||0)} card${Number(r.sent_count||0)===1?"":"s"}`).join(" • ")}</div></div>`;
    if(type==="CALAMITY") return `<div class="event-log-entry"><div class="event-log-head"><strong>#${card} • CALAMITY</strong><span>${esc(String(e.code||""))}</span></div><div>${(e.results||[]).map(r=>{if(r.no_effect)return `${esc(r.display_name)}: no effect`;const rr=RESOURCES[Number(r.resource_id)]||{name:"resource",icon:""};const payout=Number(r.cash||0)>0?` → ${Number(r.units||0)} ${MARKET_META[r.byproduct]?.icon||""} ${esc(marketDisplayName(r.byproduct||""))} × $${Number(r.price||0)} = <strong>+$${Number(r.cash||0)}</strong>`:"";return `${esc(r.display_name)}${r.xed?` • X1 ${rr.icon} ${esc(rr.name)}`:""}${payout}${r.cash_change?` ${moneyDelta(r.cash_change)}`:""}`}).join(" • ")||marketDiff(e.market_before,e.market_after)}</div></div>`;
    if(e?.skipped_in_v05a) return `<div class="event-log-entry log-skip"><div class="event-log-head"><strong>#${card} • ${esc(type)} SKIPPED (TEST)</strong><span>section ${sec}</span></div></div>`;
    return `<div class="event-log-entry"><div class="event-log-head"><strong>#${card} • ${esc(type)}</strong><span>section ${sec}</span></div></div>`;
  }

  function byproductSummary(units){
    if(!units||typeof units!=="object") return "";
    return Object.entries(units).map(([k,v])=>`${MARKET_META[k]?.icon||""}${esc(marketDisplayName(k))} ${Number(v)}`).join(", ");
  }
  function marketDisplayName(name){ return name==="Vegetables"?"Veg.":name; }
  function marketDiff(before,after){
    if(!before||!after) return "";
    const parts=MARKET_ORDER.filter(k=>Number(before[k]||7)!==Number(after[k]||7)).map(k=>{
      const b=Number(before[k]||7), a=Number(after[k]||7);
      return `${MARKET_META[k]?.icon||""}${esc(marketDisplayName(k))} Step ${b} ($${marketPrice(k,b)}) → Step ${a} ($${marketPrice(k,a)})`;
    });
    return parts.length?`<div class="tiny market-diff" style="margin-top:5px">${parts.join(" • ")}</div>`:"";
  }
  function moneyDelta(v){ const n=Number(v||0); return `${n>=0?"+":"−"}$${Math.abs(n)}`; }

  function boardState(){
    const raw=ui.server?.me?.board_state||{};
    const zeros=Array(18).fill(0);
    const liv=Array.isArray(raw.livestock_counts)?raw.livestock_counts.map(Number):zeros.slice();
    const cr=Array.isArray(raw.crop_counts)?raw.crop_counts.map(Number):zeros.slice();
    const livx=Array.isArray(raw.livestock_xed)?raw.livestock_xed.map(Number):zeros.slice();
    const crx=Array.isArray(raw.crop_xed)?raw.crop_xed.map(Number):zeros.slice();
    const maskFallback=(counts,xed)=>counts.map((n,i)=>{
      const x=Number(xed[i]||0), c=Number(n||0);
      return c?((2**c-1)<<x):0;
    });
    const xMaskFallback=xed=>xed.map(x=>Number(x||0)?(2**Number(x)-1):0);
    return {
      livestock_counts:liv,crop_counts:cr,livestock_xed:livx,crop_xed:crx,
      livestock_circle_masks:Array.isArray(raw.livestock_circle_masks)?raw.livestock_circle_masks.map(Number):maskFallback(liv,livx),
      livestock_x_masks:Array.isArray(raw.livestock_x_masks)?raw.livestock_x_masks.map(Number):xMaskFallback(livx),
      crop_circle_masks:Array.isArray(raw.crop_circle_masks)?raw.crop_circle_masks.map(Number):maskFallback(cr,crx),
      crop_x_masks:Array.isArray(raw.crop_x_masks)?raw.crop_x_masks.map(Number):xMaskFallback(crx),
      draw_track:raw.draw_track||{
        "1":{circled:0,xed:0,capacity:3},"2":{circled:0,xed:0,capacity:3},"3":{circled:0,xed:0,capacity:3},
        "4":{circled:0,xed:0,capacity:4},"5":{circled:0,xed:0,capacity:7},"6":{circled:0,xed:0,capacity:8}
      },
      play_pending:Number(raw.play_pending||0)
    };
  }

  function cashOnHand(){ return Number(ui.server?.me?.cash??100); }
  function faceUnlocked(face){
    if(Number(face)<1||Number(face)>6) return false;
    const t=boardState().draw_track?.[String(face)]||{};
    return Number(t.capacity||0)>0 && Number(t.xed||0)>=Number(t.capacity||0);
  }
  function dieCost(d){
    if(!d) return 0;
    if(d.type==="white") return 0;
    const face=Number(d.value||0);
    if(d.type==="black") return faceUnlocked(face)?0:face;
    if(d.type==="livestock"||d.type==="crop"){
      if((face===7||face===8)&&hasPower("sevens_eights_free")) return 0;
      return face<=6&&faceUnlocked(face)?0:5;
    }
    return 0;
  }
  function fenceDraftCost(){
    const n=(ui.fenceDraft||[]).length;
    return hasPower("efficient_fencing")?Math.ceil(n/2):n;
  }
  function committedActionCost(){
    const dice=Object.fromEntries(sharedDice().map(d=>[d.id,d]));
    return (ui.editor.actions||[]).reduce((sum,a)=>sum+(a.diceIds||[]).reduce((ss,id)=>ss+dieCost(dice[id]),0),0);
  }

  function currentOpenObligations(){
    const s=boardState();
    const draw=Object.values(s.draw_track||{}).reduce((n,t)=>n+Number(t?.circled||0),0);
    const play=playTrack().filter(x=>Number(x)===1).length;
    const round=(ui.editor.actions||[]).reduce((n,a)=>n+((a.type==="house"||a.type==="blacktrack")?1:0),0);
    return draw+play+round;
  }
  function estimatedFirstResourceFee(){
    const feeEach=currentOpenObligations();
    if(feeEach<=0) return 0;
    const seen=new Set(); let fee=0;
    for(const a of (ui.editor.actions||[])){
      if(a.type!=="livestock"&&a.type!=="crop") continue;
      const row=Number(a.target||0), key=`${a.type}:${row}`;
      if(seen.has(key)) continue;
      const s=boardState();
      const living=Number((a.type==="livestock"?s.livestock_counts:s.crop_counts)?.[row-1]||0);
      const xed=Number((a.type==="livestock"?s.livestock_xed:s.crop_xed)?.[row-1]||0);
      if(living+xed===0) fee+=feeEach;
      seen.add(key);
    }
    return fee;
  }

  function sidePreset(side,player=ui.server?.me){
    const g=ui.server?.game||{};
    if(side==="livestock") return player?.livestock_preset||g.livestock_preset||player?.board_preset||"Standard";
    return player?.crop_preset||g.crop_preset||player?.board_preset||"Standard";
  }
  function resourceIds(side){
    const player=ui.server?.me||{};
    const direct=side==="livestock"?player.livestock_ids:player.crop_ids;
    if(Array.isArray(direct)&&direct.length===18) return direct.map(Number);
    const preset=sidePreset(side,player);
    const map=BOARD_MAPS[preset];
    if(map&&Array.isArray(map[side])&&map[side].length===18) return map[side];
    // Never silently substitute Standard for a non-Standard saved board.
    return preset==="Standard"?BOARD_MAPS.Standard[side]:[];
  }

  function resourceCountById(id){
    for(const side of ["livestock","crop"]){
      const idx=resourceIds(side).indexOf(Number(id));
      if(idx>=0) return Number((side==="livestock"?boardState().livestock_counts:boardState().crop_counts)[idx]||0);
    }
    return 0;
  }

  function queuedResourceCount(side,slot){ return ui.editor.actions.filter(a=>a.type===side&&Number(a.target)===Number(slot)).length; }
  function cellState(side,slot,cell){
    const s=boardState(), bit=1<<(cell-1);
    const cm=(side==="livestock"?s.livestock_circle_masks:s.crop_circle_masks)[slot-1]||0;
    const xm=(side==="livestock"?s.livestock_x_masks:s.crop_x_masks)[slot-1]||0;
    if(xm&bit) return "x";
    if(cm&bit) return "circle";
    return "blank";
  }

  function existingFences(){ return Array.isArray(ui.server?.me?.fence_segments)?ui.server.me.fence_segments.map(String):[]; }
  function combinedFences(){ return [...new Set([...existingFences(),...(ui.fenceDraft||[]).map(String)])]; }
  function fenceHas(id,fences=combinedFences()){ return fences.includes(id); }
  function fenceState(id){ return existingFences().includes(id)?"permanent":(ui.fenceDraft||[]).includes(id)?"draft":"empty"; }
  function toggleFence(id){
    if(ui.server?.game?.phase!=="choose_actions"||ui.server?.my_submission||existingFences().includes(id)) return;
    const d=new Set(ui.fenceDraft||[]);
    if(d.has(id)) d.delete(id); else d.add(id);
    ui.fenceDraft=[...d]; saveLocal(); render();
  }
  function livestockCellEnclosed(row,cell,fences=combinedFences()){
    const cap=SLOT_CAPS[row-1]||0;
    for(let l=0;l<=cell-1;l++){
      if(!fenceHas(`v:${row}:${l}`,fences)) continue;
      for(let r=cell;r<=cap;r++){
        if(!fenceHas(`v:${row}:${r}`,fences)) continue;
        let ok=true;
        for(let x=l+1;x<=r;x++){
          if(!fenceHas(`h:${row-1}:${x}`,fences)||!fenceHas(`h:${row}:${x}`,fences)){ok=false;break;}
        }
        if(ok) return true;
      }
    }
    return false;
  }
  function blankCapacity(side,slot){
    const cap=SLOT_CAPS[slot-1]||0;
    let n=0;
    for(let c=1;c<=cap;c++) if(cellState(side,slot,c)==="blank" && (side!=="livestock"||livestockCellEnclosed(slot,c))) n++;
    return n;
  }
  function resourceSpaceAvailable(side,slot){
    if(side!=="livestock"&&side!=="crop") return true;
    return blankCapacity(side,slot)>queuedResourceCount(side,slot);
  }
  function queuedResourcesFit(){
    for(const side of ["livestock","crop"]){
      for(let slot=1;slot<=18;slot++) if(queuedResourceCount(side,slot)>blankCapacity(side,slot)) return false;
    }
    return true;
  }

  function blackTrackSpaceAvailable(face){
    const s=boardState();
    const t=s.draw_track?.[String(face)]||{circled:0,xed:0,capacity:0};
    const queued=ui.editor.actions.filter(a=>a.type==="blacktrack"&&Number(a.face)===Number(face)).length;
    return Number(t.circled||0)+Number(t.xed||0)+queued<Number(t.capacity||0);
  }

  function marketPrice(name,step){
    const prices=MARKET_META[name]?.prices||[];
    const n=Math.max(1,Math.min(13,Number(step||7)));
    return Number(prices[n-1]||0);
  }
  function marketPanel(){
    const steps=ui.server?.game?.market_steps||{};
    return `<section class="card market-card"><div class="topbar"><div><h2 style="margin:0">📈 Shared Markets</h2><div class="tiny">All markets start Step 7 • Harvest/Butcher pays before its market drop</div></div><span class="phase-pill">GLOBAL</span></div>
      <div class="market-grid">${MARKET_ORDER.map(name=>{const st=Number(steps[name]||7);return `<div class="market-tile ${st===1?"market-low":st===13?"market-high":""}"><div class="market-name">${MARKET_META[name]?.icon||""} ${esc(marketDisplayName(name))}</div><div class="market-price">$${marketPrice(name,st)}</div><div class="market-step">Step ${st}</div></div>`}).join("")}</div>
      <details class="market-reference" id="marketReference" ${ui.marketChartOpen?"open":""}><summary>📊 View full market chart</summary>${marketReferenceTable(steps)}</details>
    </section>`;
  }

  function marketReferenceTable(steps){
    return `<div class="market-table-scroll" data-scroll-key="market-reference"><table class="market-table"><thead><tr><th>Byproduct</th>${Array.from({length:13},(_,i)=>`<th class="${i===6?"start-step":""}">S${i+1}</th>`).join("")}</tr></thead><tbody>${MARKET_ORDER.map(name=>`<tr><th>${MARKET_META[name]?.icon||""} ${esc(marketDisplayName(name))}</th>${MARKET_META[name].prices.map((price,i)=>{const current=Number(steps[name]||7)===i+1;return `<td class="${current?"current-price":""}">$${price}</td>`}).join("")}</tr>`).join("")}</tbody></table></div>`;
  }

  function fenceCommitPanel(){
    const row=Math.max(1,Math.min(18,Number(ui.fenceRow||1))), cap=SLOT_CAPS[row-1];
    const id=resourceIds("livestock")[row-1], r=RESOURCES[id]||{icon:"•",name:`Row ${row}`};
    const draft=(ui.fenceDraft||[]).length;
    const top=Array.from({length:cap},(_,i)=>fenceSegmentButton(`h:${row-1}:${i+1}`,"h"));
    const bottom=Array.from({length:cap},(_,i)=>fenceSegmentButton(`h:${row}:${i+1}`,"h"));
    const cells=Array.from({length:cap},(_,i)=>{
      const c=i+1, state=cellState("livestock",row,c), fenced=livestockCellEnclosed(row,c);
      return `<div class="fence-cell-unit">${fenceSegmentButton(`v:${row}:${i}`,"v")}<div class="fence-cell ${state} ${fenced?"enclosed":""}"><span>${state==="circle"?"◉":state==="x"?"X":c}</span></div></div>`;
    });
    const right=fenceSegmentButton(`v:${row}:${cap}`,"v");
    const previewCost=hasPower("efficient_fencing")?Math.ceil(draft/2):draft;
    return `<section class="card fence-card"><div class="topbar"><div><h2 style="margin:0">🪵 Fences — free action</h2><div class="tiny">${hasPower("efficient_fencing")?"Efficient Fencing: every 2 new paid segments cost $1":"$1 per new segment"} • incomplete fencing allowed • permanent at Commit</div></div><span class="phase-pill">${draft} NEW • $${previewCost}</span></div>
      <div class="grid two" style="margin-top:10px"><label>Livestock row<select id="fenceRowSelect">${Array.from({length:18},(_,i)=>{const rid=resourceIds("livestock")[i],rr=RESOURCES[rid]||{};return `<option value="${i+1}" ${row===i+1?"selected":""}>${i+1} • ${rr.icon||""} ${esc(rr.short||rr.name||"")}</option>`}).join("")}</select></label><div class="fence-summary"><strong>${r.icon} ${esc(r.name)}</strong><span>${cap} cells • ${blankCapacity("livestock",row)} fenced blank</span></div></div>
      <div class="fence-help">Tap an edge to buy it tentatively. <strong>Green</strong> = already permanent; <strong>gold</strong> = new this commit. Shared horizontal borders are the same fence when viewed from either adjacent row.</div>
      <div class="fence-scroll" data-scroll-key="fence-row-${row}"><div class="fence-hline">${top.join("")}</div><div class="fence-middle">${cells.join("")}${right}</div><div class="fence-hline">${bottom.join("")}</div></div>
      <div class="tiny" style="margin-top:8px">A normal pen needs continuous top + bottom fences and an end cap on each side. Exterior edges are not free.</div></section>`;
  }
  function fenceSegmentButton(id,orientation){
    const state=fenceState(id), title=state==="permanent"?"Permanent fence":state==="draft"?"New fence — tap to remove before Commit":"Add $1 fence";
    return `<button class="fence-segment ${orientation} ${state}" data-fence="${id}" title="${title}" ${state==="permanent"?"disabled":""}></button>`;
  }

  function farmPanel(){
    const livestockPreset=sidePreset("livestock"), cropPreset=sidePreset("crop");
    const view=ui.farmView||"livestock";
    return `<section class="card farm-card">
      <div class="topbar" style="align-items:center">
        <div><h2 style="margin:0">🚜 My Farm</h2><div class="tiny">🐄 ${esc(livestockPreset)} livestock • 🌱 ${esc(cropPreset)} crops • persistent server state</div></div>
        <span class="phase-pill">v${VERSION}</span>
      </div>
      <div class="farm-tabs">
        <button class="${view==="livestock"?"active":""}" data-farm-view="livestock">🐄 Livestock</button>
        <button class="${view==="crop"?"active":""}" data-farm-view="crop">🌱 Crops</button>
        <button class="${view==="tracks"?"active":""}" data-farm-view="tracks">🏠 / ⬛ Tracks</button>
      </div>
      ${view==="tracks"?trackPanel():resourcePanel(view)}
    </section>`;
  }

  function resourcePanel(side){
    const s=boardState();
    const counts=side==="livestock"?s.livestock_counts:s.crop_counts;
    const ids=resourceIds(side);
    const total=counts.reduce((a,b)=>a+Number(b||0),0);
    return `<div style="margin-top:12px">
      <div class="small" style="margin-bottom:8px"><strong>${side==="livestock"?"Livestock":"Crops"} acquired:</strong> ${total}<br><span class="tiny">💰 = lifetime dollars generated by that resource; spending/losses are not subtracted. 🐝 Enabled is non-additive pollination contribution.</span></div>
      <div class="resource-list">
        ${ids.map((id,i)=>resourceRow(i+1,id,Number(counts[i]||0),SLOT_CAPS[i])).join("")}
      </div>
    </div>`;
  }

  function resourceRow(slot,id,count,cap){
    const r=RESOURCES[id]||{name:`Resource ${id}`,short:`R${id}`,icon:"•"};
    const side=(resourceIds("livestock")[slot-1]===id)?"livestock":"crop";
    const s=boardState(), xed=Number((side==="livestock"?s.livestock_xed:s.crop_xed)[slot-1]||0);
    const occupied=count+xed, full=occupied>=cap, rowScore=currentRowScore(slot,occupied);
    const markers=rowMarkers(slot);
    const cells=Array.from({length:cap},(_,j)=>{
      const pos=j+1,state=cellState(side,slot,pos), fenced=side==="livestock"&&livestockCellEnclosed(slot,pos,existingFences());
      const ms=markers.filter(m=>m.threshold===pos).map(m=>{const reached=occupied>=m.threshold,surpassed=occupied>m.threshold;const info=`${m.icon} ${m.name} — reach ${m.threshold} occupied spaces on Row ${slot}. ${m.points} VP tier. Reached markers remain reached for future Powers even if surpassed.`;return `<button class="score-marker ${m.type} ${reached?"reached":""} ${surpassed?"surpassed":""}" data-marker-info="${esc(info)}" aria-label="${esc(info)}">${m.icon}</button>`}).join("");
      return `<span class="resource-cell-wrap"><span class="resource-cell ${state} ${fenced?"fenced":""}" title="cell ${pos}${fenced?" • fenced":""}">${state==="x"?"×":state==="circle"?"●":""}</span>${ms}</span>`;
    }).join("");
    return `<div class="resource-row ${full?"full":""}" data-resource-row="${slot}">
      <div class="resource-number">${slot}</div>
      <div class="resource-title"><span class="resource-icon">${r.icon}</span><div><strong>${esc(r.short)}</strong><div class="tiny">${esc(r.name)}</div><div class="resource-helper">${esc(RESOURCE_HELPERS[id]||"")}</div><div class="resource-profit">💰 $${Number(ui.server?.me?.resource_profit?.[String(id)]||0)}${id===32&&Number(ui.server?.me?.resource_enabled_profit?.[String(id)]||0)?` • 🐝 Enabled +$${Number(ui.server.me.resource_enabled_profit[String(id)]||0)}`:""}</div></div></div>
      <div class="resource-count">${count}${xed?` + ${xed}X`:""}/${cap}<div class="row-vp">⭐${rowScore}</div></div>
      <div class="resource-track">${cells}</div>
    </div>`;
  }

  function rowMarkers(row){
    row=Number(row);
    if(row<=6) return [{type:"tree",name:"Tree",icon:"🌲",threshold:10,points:row},{type:"rock",name:"Rock",icon:"🪨",threshold:14,points:7}];
    if(row<=12) return [{type:"rock",name:"Rock",icon:"🪨",threshold:7,points:7},{type:"tree",name:"Tree",icon:"🌲",threshold:9,points:row}];
    return [{type:"rock",name:"Rock",icon:"🪨",threshold:3,points:7},{type:"tree",name:"Tree",icon:"🌲",threshold:5,points:row}];
  }

  function currentRowScore(row,occupied){
    row=Number(row); occupied=Number(occupied||0);
    if(row<=6) return occupied>=14?7:occupied>=10?row:0;
    if(row<=12) return occupied>=9?row:occupied>=7?7:0;
    return occupied>=5?row:occupied>=3?7:0;
  }

  function trackPanel(){
    const s=boardState();
    const pending=Object.values(s.draw_track).reduce((sum,t)=>sum+Number(t.circled||0),0);
    return `<div style="margin-top:12px">
      <div class="track-summary">
        <div><strong>⬛ Draw Cards / black-die track</strong><div class="tiny">${pending} circled draw obligation${pending===1?"":"s"} waiting to be X'd</div></div>
      </div>
      <div class="draw-columns">
        ${[1,2,3,4,5,6].map(face=>drawColumn(face,s.draw_track[String(face)])).join("")}
      </div>
      <div class="tiny track-legend">◉ circled / still owed &nbsp; ⓧ X'd / completed &nbsp; ○ available</div>
      <div class="note" style="margin-top:10px">
        The rolled black die automatically circles its face for every player when space remains. During <strong>Draw Cards</strong>, every usable pending circle is mandatory. When every circle in a number is X'd, that number becomes <strong>$0 on the black, livestock, and crop dice</strong>. Completing <strong>any 4 of the 6 face columns</strong> triggers the endgame countdown. Each face also points to one randomly assigned themed Draw Deck for the whole game. Values 7–8 normally cost $5 on the specialty d8s; <strong>7s &amp; 8s Are Free</strong> makes those rolls $0.
      </div>
      ${playTrackPanel()}
    </div>`;
  }

  function drawColumn(face,t){
    t=t||{circled:0,xed:0,capacity:0};
    const xed=Number(t.xed||0), circled=Number(t.circled||0), cap=Number(t.capacity||0);
    const marks=[];
    for(let i=0;i<cap;i++){
      if(i<xed) marks.push('<span class="track-x">ⓧ</span>');
      else if(i<xed+circled) marks.push('<span class="track-circle">◉</span>');
      else marks.push('<span class="track-empty">○</span>');
    }
    const unlocked=(xed>=cap&&cap>0);
    return `<div class="draw-column ${unlocked?"unlocked":""}">
      <div class="draw-face">${face}</div>
      ${deckSlot(face)?.theme?`<div class="draw-deck-theme">${deckSlot(face).emoji} ${esc(deckSlot(face).theme)}${Number.isFinite(deckSlot(face).remaining)?` • ${deckSlot(face).remaining}`:""}</div>`:""}
      <div class="draw-marks">${marks.join("")}</div>
      <div class="tiny">${unlocked?`ALL ${face}s FREE`:`${xed}/${cap} X • ${Math.max(0,cap-xed)} left${circled?` • ${circled} pending`:""}`}</div>
    </div>`;
  }

  function dieLabel(d){
    const c=dieCost(d);
    if(d.type==="black") return `Black d6 • ${c?`$${c}`:"FREE"}`;
    if(d.type==="livestock") return `Livestock d8 • ${c?`$${c}`:"FREE"}`;
    if(d.type==="crop") return `Crop d8 • ${c?`$${c}`:"FREE"}`;
    return `${d.name} • free`;
  }
  function blackFaceChoice(face){
    const t=boardState().draw_track?.[String(face)]||{};
    const x=Number(t.xed||0), c=Number(t.circled||0), cap=Number(t.capacity||0), left=Math.max(0,cap-x);
    const sub=x>=cap&&cap>0?"FREE":`${x}/${cap} X • ${left} left${c?` • ${c} pending`:""}`;
    return `<button class="face face-status ${ui.editor.blackFace===face?"active":""}" data-face="${face}" ${blackTrackSpaceAvailable(face)?"":"disabled"}><strong>${face}</strong><small>${sub}</small></button>`;
  }

  function resourceActionStatus(type,row){
    const s=boardState(), idx=Number(row)-1;
    const live=Number((type==="livestock"?s.livestock_counts:s.crop_counts)?.[idx]||0);
    const xx=Number((type==="livestock"?s.livestock_xed:s.crop_xed)?.[idx]||0);
    const owned=live+xx, cap=Number(SLOT_CAPS[idx]||0), points=currentRowScore(row,owned);
    return `${owned}/${cap} owned • ${live} live • ${xx} X • ⭐ ${points} VP`;
  }

  function actionHint(type,ds,sum){
    if(type==="house"){
      const idx=nextPlayIndex();
      if(!idx) return "Your Play Cards track is full.";
      const typ=playTypeAt(idx);
      return `Zero-dice action: circle Play Cards space #${idx} ${PLAY_ICON[typ]} (${playTypeName(typ)}).`;
    }
    if(type==="blacktrack"){ const t=boardState().draw_track?.[String(ui.editor.blackFace)]||{}; const x=Number(t.xed||0),cap=Number(t.capacity||0),c=Number(t.circled||0); return blackTrackSpaceAvailable(ui.editor.blackFace)?`Zero-dice action: circle face ${ui.editor.blackFace}. <strong>${x}/${cap} completed</strong> • ${Math.max(0,cap-x)} not X’d${c?` • ${c} already pending`:""}.`:`Face ${ui.editor.blackFace} is fully X’d and FREE.`; }
    if(!ds.length)return `Select 1–${resourceDiceLimit()} available dice to make a ${type} row from 1–18.`;
    if(!hasPower("flexible")&&type==="crop"&&ds.some(d=>d.type==="livestock"))return "Livestock d8 cannot acquire crops unless Flexible is active.";
    if(!hasPower("flexible")&&type==="livestock"&&ds.some(d=>d.type==="crop"))return "Crop d8 cannot acquire livestock unless Flexible is active.";
    if(ds.length>resourceDiceLimit())return `This action can use at most ${resourceDiceLimit()} dice.`;
    if(sum>18&&!hasPower("committed"))return `Raw total ${sum} is above 18. Committed is required to map it to a farm row.`;
    const target=effectiveResourceTarget();
    if(target<1||target>18)return `Target ${target} is outside rows 1–18.`;
    if(!resourceSpaceAvailable(type,target)){ if(type==="livestock"){const rid=resourceIds("livestock")[target-1],rr=RESOURCES[rid]||{};return `<strong>${rr.icon||"🐄"} ${esc(rr.name||`Livestock row ${target}`)}</strong> — Row ${target} needs a fully fenced blank cell. <button class="inline-jump" data-jump-row="${target}">Jump to Row ${target}</button>`;} return `Crop row ${target} has no blank cell left.`; }
    const rid=resourceIds(type)[target-1], rr=RESOURCES[rid];
    const mapped=sum>=19&&target!==sum?` • raw ${sum} → ${target} via Committed`:"";
    return `Valid ${type} action: row ${target}${rr?` • ${rr.icon} ${rr.short}`:""}${mapped}.<div class="action-row-status">${resourceActionStatus(type,target)}</div>`;
  }
  function actionSlot(i){
    const a=ui.editor.actions[i];
    if(!a)return `<div class="action-slot"><div class="slot-num">${i+1}</div><div class="small">Empty action slot</div></div>`;
    return `<div class="action-slot filled"><div class="slot-num">${i+1}</div><div><div class="action-main">${esc(a.title)}</div><div class="action-detail">${esc(a.detail)}</div></div><div>✓</div></div>`;
  }
  function messageBlock(){
    if(!ui.message)return "";
    const err=ui.message.startsWith("ERR:");
    return `<section class="card note ${err?"error":""}">${esc(ui.message.replace(/^ERR:/,""))}</section>`;
  }

  function jumpToLivestockRow(row){
    ui.farmView="livestock"; ui.fenceRow=row; saveLocal(); render();
    setTimeout(()=>{
      const fence=document.querySelector(".fence-card");
      const rowEl=document.querySelector(`[data-resource-row="${row}"]`);
      const el=fence||rowEl;
      if(el){el.scrollIntoView({behavior:"smooth",block:"center"});el.classList.add("jump-highlight");setTimeout(()=>el.classList.remove("jump-highlight"),1800);}
    },80);
  }
  function markerToast(text){
    let t=document.getElementById("markerToast"); if(!t){t=document.createElement("div");t.id="markerToast";t.className="marker-toast";document.body.appendChild(t);}
    t.textContent=text;t.classList.add("show");clearTimeout(markerToast._timer);markerToast._timer=setTimeout(()=>t.classList.remove("show"),3200);
  }
  function bindLongPressMarker(el){
    let timer=null, fired=false;
    const start=e=>{fired=false;clearTimeout(timer);timer=setTimeout(()=>{fired=true;markerToast(el.dataset.markerInfo||"");navigator.vibrate?.(25);},520);};
    const stop=e=>{clearTimeout(timer);};
    el.addEventListener("pointerdown",start,{passive:true});el.addEventListener("pointerup",stop,{passive:true});el.addEventListener("pointercancel",stop,{passive:true});el.addEventListener("pointerleave",stop,{passive:true});
    el.addEventListener("click",e=>{if(fired){e.preventDefault();e.stopPropagation();fired=false;}});
  }

  function bind(){
    $("#createBtn")?.addEventListener("click",createGame);
    $("#joinBtn")?.addEventListener("click",joinGame);
    $("#createDeckFamily")?.addEventListener("change",syncCreateSetupControls);
    $("#createBoardMode")?.addEventListener("change",syncCreateSetupControls);
    $("#createBotCount")?.addEventListener("change",syncBotConfigRows);
    $("#createLivestock")?.addEventListener("change",syncBotConfigRows);
    $("#createCrop")?.addEventListener("change",syncBotConfigRows);
    document.querySelectorAll("[data-copy-bot]").forEach(btn=>btn.addEventListener("click",()=>{
      const idx=Number(btn.dataset.copyBot||0);
      const rows=[...document.querySelectorAll("[data-bot-config]")];
      const prev=rows[idx-1], cur=rows[idx];
      if(!prev||!cur) return;
      ["type","livestock","crop"].forEach(k=>{
        const attr=k==="type"?"[data-bot-type]":k==="livestock"?"[data-bot-livestock]":"[data-bot-crop]";
        const a=prev.querySelector(attr),b=cur.querySelector(attr); if(a&&b)b.value=a.value;
      });
    }));
    syncCreateSetupControls();
    $("#rollBtn")?.addEventListener("click",hostRoll);
    $("#refreshBtn")?.addEventListener("click",()=>refreshRoom(true));
    $("#copyBtn")?.addEventListener("click",copyInvite);
    $("#leaveBtn")?.addEventListener("click",leaveLocal);
    $("#deleteGameBtn")?.addEventListener("click",deleteCurrentGame);
    document.querySelectorAll("[data-workspace]").forEach(x=>x.addEventListener("click",()=>{ui.workspaceView=x.dataset.workspace||"play";saveLocal();render();}));
    $("#nextBtn")?.addEventListener("click",nextRound);
    $("#submitBtn")?.addEventListener("click",submitActions);
    $("#undoBtn")?.addEventListener("click",undo);
    $("#addBtn")?.addEventListener("click",addAction);
    document.querySelectorAll("[data-die]").forEach(x=>x.addEventListener("click",()=>toggleDie(x.dataset.die)));
    document.querySelectorAll("[data-type]").forEach(x=>x.addEventListener("click",()=>chooseType(x.dataset.type)));
    document.querySelectorAll("[data-face]").forEach(x=>x.addEventListener("click",()=>{ui.editor.blackFace=Number(x.dataset.face);saveLocal();render();}));
    document.querySelectorAll("[data-farm-view]").forEach(x=>x.addEventListener("click",()=>{ui.farmView=x.dataset.farmView;saveLocal();render();}));
    document.querySelectorAll("[data-draw-plan-plus]").forEach(x=>x.addEventListener("click",()=>changeDrawDraft(x.dataset.drawPlanPlus,1)));
    document.querySelectorAll("[data-draw-plan-minus]").forEach(x=>x.addEventListener("click",()=>changeDrawDraft(x.dataset.drawPlanMinus,-1)));
    document.querySelectorAll("[data-init-card]").forEach(x=>x.addEventListener("click",()=>toggleInitiativeCard(x.dataset.initCard)));
    $("#submitDrawPlanBtn")?.addEventListener("click",submitDrawPlan);
    document.querySelectorAll("[data-power-pick]").forEach(x=>x.addEventListener("click",()=>choosePower(x.dataset.powerPick)));
    document.querySelectorAll("[data-play-choice]").forEach(x=>x.addEventListener("change",()=>setPlayChoice(x.dataset.playChoice,x.value)));
    $("#submitPlayBtn")?.addEventListener("click",submitPlayCards);
    document.querySelectorAll("[data-mayor-card]").forEach(x=>x.addEventListener("click",()=>mayorChoose(x.dataset.mayorCard,x.dataset.mayorPos)));
    $("#eventReadyBtn")?.addEventListener("click",eventReady);
    $("#resumeEventsBtn")?.addEventListener("click",runEventEngine);
    $("#skipDeferredBtn")?.addEventListener("click",skipDeferredSection);
    $("#calamityNoEffectBtn")?.addEventListener("click",()=>submitCalamity(null));
    document.querySelectorAll("[data-calamity-resource]").forEach(x=>x.addEventListener("click",()=>submitCalamity(x.dataset.calamityResource)));
    $("#submitButcherBtn")?.addEventListener("click",submitButcher);
    $("#submitVanityBtn")?.addEventListener("click",()=>submitVanity(ui.vanityDraft?.left||null,ui.vanityDraft?.right||null));
    document.querySelectorAll("[data-vanity-dir]").forEach(x=>x.addEventListener("change",()=>setVanityDraft(x.dataset.vanityDir,x.value)));
    document.querySelectorAll("[data-vanity-one]").forEach(x=>x.addEventListener("click",()=>{const card=handCards()[0]?.card_number;if(!card)return;submitVanity(x.dataset.vanityOne==="left"?card:null,x.dataset.vanityOne==="right"?card:null);}));
    $("#marketReference")?.addEventListener("toggle",e=>{ui.marketChartOpen=!!e.currentTarget.open;saveLocal();});
    document.querySelectorAll("[data-deck-slot]").forEach(el=>el.addEventListener("click",()=>{const n=Number(el.dataset.deckSlot);ui.openDeckSlot=Number(ui.openDeckSlot)===n?null:n;saveLocal();render();}));
    document.querySelectorAll("[data-live-farm]").forEach(el=>el.addEventListener("toggle",e=>{ui.liveFarmOpen=ui.liveFarmOpen||{};ui.liveFarmOpen[e.currentTarget.dataset.liveFarm]=!!e.currentTarget.open;saveLocal();}));
    $("#finalRevealAckBtn")?.addEventListener("click",ackFinalReveal);
    document.querySelectorAll("[data-final-player]").forEach(el=>el.addEventListener("toggle",e=>{ui.finalOpenPlayers=ui.finalOpenPlayers||{};ui.finalOpenPlayers[e.currentTarget.dataset.finalPlayer]=!!e.currentTarget.open;saveLocal();}));
    document.querySelectorAll("[data-final-audit]").forEach(el=>el.addEventListener("toggle",e=>{ui.finalAuditOpen=ui.finalAuditOpen||{};ui.finalAuditOpen[e.currentTarget.dataset.finalAudit]=!!e.currentTarget.open;saveLocal();}));
    document.querySelectorAll("[data-butcher-species]").forEach(x=>x.addEventListener("click",()=>changeButcherCount(x.dataset.butcherSpecies,x.dataset.butcherSex,Number(x.dataset.delta))));
    document.querySelectorAll("[data-butcher-output]").forEach(x=>x.addEventListener("click",()=>setButcherOutput(x.dataset.butcherOutput,x.dataset.output)));
    document.querySelectorAll("[data-jump-row]").forEach(x=>x.addEventListener("click",()=>jumpToLivestockRow(Number(x.dataset.jumpRow))));
    document.querySelectorAll("[data-marker-info]").forEach(el=>bindLongPressMarker(el));
    document.querySelectorAll("[data-fence]").forEach(x=>x.addEventListener("click",()=>toggleFence(x.dataset.fence)));
    $("#fenceRowSelect")?.addEventListener("change",e=>{ui.fenceRow=Number(e.target.value);saveLocal();render();});
    $("#committedTargetSelect")?.addEventListener("change",e=>{ui.editor.committedTarget=Number(e.target.value);saveLocal();render();});

    document.querySelectorAll("select,input,textarea").forEach(el=>{
      el.addEventListener("focus",()=>holdBackgroundRender(60000));
      el.addEventListener("blur",()=>{
        interactionHoldUntil=Date.now()+120;
        setTimeout(flushBackgroundRender,160);
      });
    });
    document.querySelectorAll("[data-scroll-key]").forEach(el=>{
      el.addEventListener("pointerdown",beginRailInteraction,{passive:true});
      el.addEventListener("touchstart",beginRailInteraction,{passive:true});
      el.addEventListener("scroll",()=>{
        scrollMemory[el.dataset.scrollKey]=el.scrollLeft;
        holdBackgroundRender(800);
        clearTimeout(railReleaseTimer);
        railReleaseTimer=setTimeout(()=>{ if(railInteractionDepth===0){interactionHoldUntil=Date.now();flushBackgroundRender();} },850);
      },{passive:true});
    });
    document.querySelectorAll("[data-scroll-key]").forEach(el=>{
      el.addEventListener("pointerup",endRailInteraction,{passive:true});
      el.addEventListener("pointercancel",endRailInteraction,{passive:true});
      el.addEventListener("touchend",endRailInteraction,{passive:true});
      el.addEventListener("touchcancel",endRailInteraction,{passive:true});
    });
  }

  window.addEventListener("load",init);
})();

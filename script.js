const $ = id => document.getElementById(id);
const NS = 'http://www.w3.org/2000/svg';
const svg = (t, a, x) => {
    const e = document.createElementNS(NS, t);
    for (const k in a) e.setAttribute(k, a[k]);
    if (x != null) e.textContent = x;
    return e;
};

const ID = ['MT', 'ST', 'D1', 'D2', 'H1', 'H2', 'D3', 'D4'];
const NAME = { ja: ID, en: ['MT', 'OT', 'M1', 'M2', 'H1', 'H2', 'R1', 'R2'] };
const PAIR = { MT: 'H1', H1: 'MT', ST: 'H2', H2: 'ST', D1: 'D3', D3: 'D1', D2: 'D4', D4: 'D2' };
const PAIRS = [['MT', 'H1'], ['ST', 'H2'], ['D1', 'D3'], ['D2', 'D4']];
const TH_GROUP = ['MT', 'ST', 'H1', 'H2'];
const DPS_GROUP = ['D1', 'D2', 'D3', 'D4'];
// ロール判定（優先順位 ヒラ＞タンク＞近接＞遠隔 の実装に使用）
const TANKS = ['MT', 'ST'];
const HEALERS = ['H1', 'H2'];
const MELEE = ['D1', 'D2'];
const RANGED = ['D3', 'D4'];
const isTank = pid => TANKS.includes(pid);
const isHealer = pid => HEALERS.includes(pid);
const isMelee = pid => MELEE.includes(pid);
const isRanged = pid => RANGED.includes(pid);

// ポジション選択画面のロール別カラー（未選択＝muted／選択済み＝active）
const ROLE_COLOR = {
    tank: { muted: '#3b5b8c', active: '#2f6feb' },
    healer: { muted: '#3f7355', active: '#22c55e' },
    dps: { muted: '#8c3b3b', active: '#ef4444' }
};
// ゲームプレイ中、自分以外の立ち位置アイコンに使うグレー（ロールに関係なく統一。
// 自分の鮮やかな色とはっきり差が出るよう、あえて無彩色にしている。不透明なので下の黄色い点は透けない）
const DIM_COLOR = '#5c6068';
function roleOf(pid) {
    if (isTank(pid)) return 'tank';
    if (isHealer(pid)) return 'healer';
    return 'dps';
}

const L = {
    ja: {
        title: '🤡 絶妖星乱舞 P2 ミッシング練習',
        lang: '言語', meth: '処理法', difficulty: '難易度', go: 'スタート',
        m: ['優先順＋立ち位置ぴれん', '南調整＋立ち位置ぴれん'],
        difficultyLabels: ['Normal', 'Hard'],
        difficultyInfo: [
            { label: 'Normal', desc: '時間制限はなく、間違えてもゲームを続行できます。' },
            { label: 'Hard', desc: '時間制限があり、間違えるとその場でゲームオーバーになります。' }
        ],
        stack: '頭割り', cone: '扇', circ: '円',
        stay: 'とどまる', south: '南側へ移動',
        again: '最初から',
        hint: 'スタート後、フィールド上のポジションをクリックして選択してください',
        selectPos: 'ポジションをクリックして選択',
        memorize: '頭上の予兆を確認してください',
        clickPoint: '黄色い点をクリックしてください（自分の正解位置）',
        ok: '✅正解',
        ng: '✖不正解',
        clr: 'クリア！',
        gameover: 'ゲームオーバー（正解位置を確認してください）'
    },
    en: {
        title: '🤡 Dancing Mad P2 Missing Trainer',
        lang: 'Language', meth: 'Strategy', difficulty: 'Difficulty', go: 'Start',
        m: ['Priority + Piren', 'South Adjust + Piren'],
        difficultyLabels: ['Normal', 'Hard'],
        difficultyInfo: [
            { label: 'Normal', desc: 'No time limit, and you can keep going even if you get it wrong.' },
            { label: 'Hard', desc: 'Timed, and a single wrong answer ends the game immediately.' }
        ],
        stack: 'Stack', cone: 'Cone', circ: 'Circle',
        stay: 'Stay', south: 'Move South',
        again: 'Restart',
        hint: 'After starting, click a position on the field to select it',
        selectPos: 'Click a position to select',
        memorize: 'Check head markers',
        clickPoint: 'Click your correct yellow point',
        ok: '✅Correct',
        ng: '✖Wrong',
        clr: 'Clear!',
        gameover: 'Game Over (check the correct position)'
    }
};

const C = [483, 485];
const ang = (a, r) => [C[0] + r * Math.sin(a * Math.PI / 180), C[1] - r * Math.cos(a * Math.PI / 180)];
const TOWERS = [[342, 622], [622, 622]];
const TOWER_R = 100;

// Aが北のときのラベル順（時計回り）
const BASE_LABELS = ['A', '2', 'B', '3', 'C', '4', 'D', '1'];

const SLOT_ODD = {
    1: [342, 597],  // 左塔・頭割り
    2: [588, 560],  // 右塔・頭割り
    3: [342, 696],  // 左塔・扇
    4: [640, 706],  // 右塔・円
    5: [342, 750],  // 扇誘導・ヒーラー
    6: [430, 559],  // 左頭割り参加・タンク
    7: [534, 559]   // 右頭割り参加・DPS×2
};

const SLOT_EVEN = {
    1: [342, 716],  // 左塔・円
    2: [622, 716],  // 右塔・円
    3: [342, 529],  // 左塔・扇
    4: [622, 529],  // 右塔・扇
    5: [229, 622],  // 扇誘導・ヒーラー（左端）
    6: [736, 622],  // 扇誘導・遠隔（右端）
    7: [383, 369],  // 雑魚誘導・タンク（北西）
    8: [581, 369]   // 雑魚誘導・近接（北東）
};

// 過去/未来（2・4・6回目後）：北1 + 南1
const POINTS_PAST_FUTURE = {
    north: [483, 300],
    south: [483, 700]
};

// 過去/未来（8回目後）：A側のみ
const POINTS_PAST_FUTURE_A = {
    a: [483, 250]
};

// 最後の過去/未来の特別処理：Aマーカーの後、「とどまる」（北寄り）か「南側へ移動」（南寄り）を選ぶ
const POINTS_FINAL_CHOICE = {
    stay: [483, 250],
    south: [483, 700]
};

const POINTS_ODD = Object.fromEntries(Object.entries(SLOT_ODD).map(([k, v]) => ['s' + k, v]));
const POINTS_EVEN = Object.fromEntries(Object.entries(SLOT_EVEN).map(([k, v]) => ['s' + k, v]));

const POS_XY = [
    [323, 600], [423, 600], [543, 600], [643, 600],
    [323, 680], [423, 680], [543, 680], [643, 680]
];

let cfg = { lang: 'ja', meth: 'pri', me: null, difficulty: 'normal' };

// 最初の画面の選択（言語・処理法・ゲームモード）をブラウザに一時保存する。
// 保存期限は24時間。更新やゲームクリア後の「最初から」で選択肢が変わってしまうのを防ぐため。
const CFG_STORAGE_KEY = 'missingTrainerCfg';
const CFG_STORAGE_MS = 24 * 60 * 60 * 1000; // 24時間

function saveCfg() {
    try {
        localStorage.setItem(CFG_STORAGE_KEY, JSON.stringify({
            lang: cfg.lang, meth: cfg.meth, difficulty: cfg.difficulty,
            savedAt: Date.now()
        }));
    } catch (e) { /* localStorageが使えない環境（プライベートモード等）では何もしない */ }
}

function loadCfg() {
    try {
        const raw = localStorage.getItem(CFG_STORAGE_KEY);
        if (!raw) return;
        const saved = JSON.parse(raw);
        const expired = !saved.savedAt || (Date.now() - saved.savedAt) > CFG_STORAGE_MS;
        if (expired) {
            localStorage.removeItem(CFG_STORAGE_KEY);
            return;
        }
        if (saved.lang) cfg.lang = saved.lang;
        if (saved.meth) cfg.meth = saved.meth;
        if (saved.difficulty) cfg.difficulty = saved.difficulty;
    } catch (e) { /* 保存データが壊れている場合は無視 */ }
}

let state = {
    run: 0,
    gameOverActive: false, // Hardモードで間違えた/時間切れになった瞬間trueにし、以降のフェーズ進行を止める
    currentMarkers: {},
    firstGroup: [],
    secondGroup: [],   // 塔を踏まないもう一方の組（4・5・6・7回目に踏む組）
    standingPos: {},
    standingSlot: {},
    towerMates: {},
    towerSide: {},
    markerTimer: null,
    currentRotation: 0,
    currentPastFuture: null, // 'past' | 'future' | null
    towerTags: {}, // pid -> 'bind1' | 'bind2' | 'stop1' | 'stop2'（3回目の塔処理後に確定）
    tagsVisible: false // bind/stopタグの表示可否：3回目〜4回目開始前 と 8回目〜 のみtrue
};

const MARKER_FILL = '#ff9a1a';
const MARKER_STROKE = '#c46a00';

function t(key) { return L[cfg.lang][key]; }

function markerNames() {
    return { stack: t('stack'), cone: t('cone'), circ: t('circ') };
}

function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

function isHealerOrRanged(pid) {
    return pid === 'H1' || pid === 'H2' || pid === 'D3' || pid === 'D4';
}

// 塔を踏まない4人（escort）の固定スロット：ヒーラー→5、遠隔→6、タンク→7、近接→8
// （assignEvenSlots・assignFinalTowerSlots・resolveEven2Slotで共通して使用）
function escortSlot(pid) {
    if (isHealer(pid)) return 5;
    if (isRanged(pid)) return 6;
    if (isTank(pid)) return 7;
    if (isMelee(pid)) return 8;
    return 5; // 念のためのフォールバック
}

function assignOpeningMarkers() {
    const { stack, cone, circ } = markerNames();
    const markers = {};
    const thGetsCone = Math.random() < 0.5;
    const assignHalf = (group, nonStackType) => {
        const order = shuffle(group);
        markers[order[0]] = stack;
        for (let i = 1; i < 4; i++) markers[order[i]] = nonStackType;
    };
    if (thGetsCone) {
        assignHalf(TH_GROUP, cone);
        assignHalf(DPS_GROUP, circ);
    } else {
        assignHalf(TH_GROUP, circ);
        assignHalf(DPS_GROUP, cone);
    }
    return markers;
}

function computeFirstGroup(markers) {
    const { stack } = markerNames();
    const first = [];
    PAIRS.forEach(([a, b]) => {
        if (markers[a] === stack || markers[b] === stack) first.push(a, b);
    });
    return first;
}

// ラウンド番号（1〜8）から、そのラウンドで塔を踏む組を返す
// 1・2・3・8回目＝頭割りがついたペア(state.firstGroup)、4・5・6・7回目＝もう一方の組(state.secondGroup)
function groupForRound(n) {
    return [1, 2, 3, 8].includes(n) ? state.firstGroup : state.secondGroup;
}

function reassignAfterTower(players, kind) {
    const { stack, cone, circ } = markerNames();
    const types = kind === 'odd'
        ? shuffle([cone, cone, circ, circ])
        : shuffle([stack, stack, cone, circ]);
    shuffle(players).forEach((pid, i) => { state.currentMarkers[pid] = types[i]; });
}

// 3回目の塔処理後、扇の2人にbind1/bind2、円の2人にstop1/stop2をランダムに1人ずつ割り当てる。
// このタグは8回目の塔踏み担当（bind1・stop1→左塔／bind2・stop2→右塔）を決め、以降ずっと表示され続ける。
function assignTowerTags(group, markers) {
    const { cone, circ } = markerNames();
    const cones = shuffle(group.filter(pid => markers[pid] === cone));
    const circs = shuffle(group.filter(pid => markers[pid] === circ));
    if (cones[0]) state.towerTags[cones[0]] = 'bind1';
    if (cones[1]) state.towerTags[cones[1]] = 'bind2';
    if (circs[0]) state.towerTags[circs[0]] = 'stop1';
    if (circs[1]) state.towerTags[circs[1]] = 'stop2';
}

/**
 * 奇数回スロット割り当て（ぴれん式・全奇数回共通）
 * ①左頭 ②右頭 ③左扇 ④右円
 * ⑤扇誘導（後組ヒラ）
 * ⑥左頭割り参加（後組タンク1人）
 * ⑦右頭割り参加（後組DPS2人・同座標）
 *
 * 後組は必ず「タンク1・ヒラ1・DPS2」になる
 * （THの頭は1人→THペアの1組だけ先組→残りTHペアが後組に入るため）
 */
// steppingGroup: 「今回」塔を踏む4人（1・2・3・8回目はfirstGroup、4・5・6・7回目はsecondGroup）
// firstGroup固定ではなく、ラウンドごとに実際に塔を踏む組を渡すこと。
// towerNum: 何回目の塔踏みか。南調整モードで、直前の偶数回の塔サイド情報を参照するために使う
// （1回目は参照できる前回データが無いため、モードに関係なく優先順ルールを使う）。
function assignOdd1Slots(markers, steppingGroup, towerNum = null) {
    const { cone, circ } = markerNames();
    const slotMap = {};
    const steppingSet = new Set(steppingGroup);
    const escort = ID.filter(pid => !steppingSet.has(pid));

    // ===== 塔を踏む4人 =====
    // 扇 → ③、円 → ④（固定・優先順位は関係ない）
    const cones = steppingGroup.filter(pid => markers[pid] === cone);
    const circs = steppingGroup.filter(pid => markers[pid] === circ);
    cones.forEach(pid => { slotMap[pid] = 3; });
    circs.forEach(pid => { slotMap[pid] = 4; });

    // 残り（扇・円がついていない人＝頭割り2人）：①左／②右
    const remaining = steppingGroup.filter(pid => slotMap[pid] == null);

    // 南調整モード：直前の偶数回で同じ塔側にいたかどうかで判定する。
    // 2人とも前回データがある場合のみ有効（1回目の頭割りは前回データが無いので対象外）。
    const useSouthAdjust = cfg.meth === 'south' && towerNum !== 1 &&
        remaining.length === 2 && state.towerSide[remaining[0]] && state.towerSide[remaining[1]];

    if (useSouthAdjust) {
        const [p1, p2] = remaining;
        const side1 = state.towerSide[p1];
        const side2 = state.towerSide[p2];

        if (side1 === side2) {
            // 直前の偶数回で同じ塔内に二人とも予兆がついた＝被り。
            // より南（Y座標が大きい）にいた方だけ反対の塔の頭割りへ移動し、
            // もう一方はそのまま元の塔側の頭割りを維持する。
            const y1 = state.standingPos[p1] ? state.standingPos[p1][1] : 0;
            const y2 = state.standingPos[p2] ? state.standingPos[p2][1] : 0;
            const southPid = y1 > y2 ? p1 : p2;
            const northPid = southPid === p1 ? p2 : p1;
            const northSlot = side1 === 'L' ? 1 : 2;
            const southSlot = side1 === 'L' ? 2 : 1;
            slotMap[northPid] = northSlot;
            slotMap[southPid] = southSlot;
        } else {
            // 被っていない（別々の塔にいた）＝それぞれ前回と同じ側の頭割りへ。
            slotMap[p1] = side1 === 'L' ? 1 : 2;
            slotMap[p2] = side2 === 'L' ? 1 : 2;
        }
    } else {
        // 優先順モード（または1回目・前回データ無し）：従来通りの優先順位ルール
        // デフォルト：タンク・ヒラ＝左、DPS＝右（ヒラ＞タンク＞近接＞遠隔の優先順）
        // 例外：
        //   ・タンクは、ペアのヒラが「残り」にいて同じ予兆マークなら右へ（ヒラに左を譲る）
        //   ・近接DPSは、ペアの遠隔が「残り」にいて同じ予兆マークなら左へ（遠隔に右を譲る）
        remaining.forEach(pid => {
            let left = isTank(pid) || isHealer(pid);

            if (isTank(pid)) {
                const partner = PAIR[pid];
                if (remaining.includes(partner) && markers[partner] === markers[pid]) {
                    left = false;
                }
            } else if (isMelee(pid)) {
                const partner = PAIR[pid];
                if (remaining.includes(partner) && markers[partner] === markers[pid]) {
                    left = true;
                }
            }

            slotMap[pid] = left ? 1 : 2;
        });
    }

    // ===== 塔を踏まない4人（escort）=====
    // ⑤扇誘導 = ヒラ
    // ⑥左頭割り参加 = タンク
    // ⑦右頭割り参加 = DPS2人（同座標）
    const tank = escort.find(pid => pid === 'MT' || pid === 'ST');
    const healer = escort.find(pid => pid === 'H1' || pid === 'H2');
    const dpsList = escort.filter(pid =>
        pid === 'D1' || pid === 'D2' || pid === 'D3' || pid === 'D4'
    );

    if (healer) slotMap[healer] = 5;
    if (tank) slotMap[tank] = 6;
    dpsList.forEach(pid => { slotMap[pid] = 7; });

    // 念のため未割り当て
    escort.forEach(pid => {
        if (slotMap[pid] == null) {
            slotMap[pid] = isHealerOrRanged(pid) ? 5 : 6;
        }
    });

    return slotMap;
}

/**
 * 偶数回スロット割り当て（優先順モード専用）
 * 偶数回は頭割りが存在せず、塔を踏む4人は必ず扇2人・円2人になる。
 * ①左塔円 ②右塔円 ③左塔扇 ④右塔扇
 *   円・扇それぞれのグループ内で、タンク・ヒラ＝デフォルト左（若い番号）、DPS＝デフォルト右（大きい番号）
 *   例外：タンクはペアのヒラと予兆が被ったら右へ／近接はペアの遠隔と予兆が被ったら左へ
 * ⑤扇誘導＝ヒーラー ⑥扇誘導＝遠隔 ⑦雑魚誘導＝タンク ⑧雑魚誘導＝近接（塔を踏まない4人・固定）
 */
function assignEvenSlots(markers, steppingGroup) {
    const { cone, circ } = markerNames();
    const slotMap = {};
    const steppingSet = new Set(steppingGroup);
    const escort = ID.filter(pid => !steppingSet.has(pid));

    const assignByPair = (group, leftSlot, rightSlot) => {
        group.forEach(pid => {
            let left = isTank(pid) || isHealer(pid);
            if (isTank(pid)) {
                const partner = PAIR[pid];
                if (group.includes(partner) && markers[partner] === markers[pid]) left = false;
            } else if (isMelee(pid)) {
                const partner = PAIR[pid];
                if (group.includes(partner) && markers[partner] === markers[pid]) left = true;
            }
            slotMap[pid] = left ? leftSlot : rightSlot;
        });
    };

    const circs = steppingGroup.filter(pid => markers[pid] === circ);
    const cones = steppingGroup.filter(pid => markers[pid] === cone);
    assignByPair(circs, 1, 2);
    assignByPair(cones, 3, 4);

    // 未割り当て（想定外のマーカー）があれば念のため埋める
    steppingGroup.forEach(pid => {
        if (slotMap[pid] == null) {
            slotMap[pid] = (isTank(pid) || isHealer(pid)) ? 1 : 2;
        }
    });

    escort.forEach(pid => { slotMap[pid] = escortSlot(pid); });

    return slotMap;
}

/**
 * 8回目の塔踏み専用。優先順位・タンクヒラDPSは一切関係なく、
 * 3回目の塔処理後に確定した bind1/bind2/stop1/stop2 タグだけで決まる。
 * bind1・stop1 → 左塔（③・①）　bind2・stop2 → 右塔（④・②）
 */
function assignFinalTowerSlots(steppingGroup) {
    const slotMap = {};
    const steppingSet = new Set(steppingGroup);
    const escort = ID.filter(pid => !steppingSet.has(pid));

    steppingGroup.forEach(pid => {
        switch (state.towerTags[pid]) {
            case 'bind1': slotMap[pid] = 3; break;  // 左塔・扇
            case 'bind2': slotMap[pid] = 4; break;  // 右塔・扇
            case 'stop1': slotMap[pid] = 1; break;  // 左塔・円
            case 'stop2': slotMap[pid] = 2; break;  // 右塔・円
        }
    });

    // タグが万一未設定の場合のフォールバック（本来は発生しない）
    steppingGroup.forEach(pid => {
        if (slotMap[pid] == null) slotMap[pid] = 1;
    });

    escort.forEach(pid => { slotMap[pid] = escortSlot(pid); });

    return slotMap;
}

/**
 * 南調整モード専用（優先順モードは assignEvenSlots を使用）。
 * 2・6回目（＝直前の奇数回で塔を踏んでおり、state.towerSide/towerMatesが確定している場合）専用。
 * 4回目（後組が初めて塔を踏む偶数回で、参照できる前回データが無い）はこの関数を使わず
 * assignEvenSlots（優先順と同じロジック）を使う。
 *
 * ルール：直前の奇数回で自分と同じ塔（左右）にいた相方（今回も塔を踏む場合のみ）を見て、
 * 今回の自分のマーカー（扇/円）と相方のマーカーが同じなら「被り」＝どちらか一方が反対の塔へ移動する。
 * 被った場合、直前の立ち位置でより南（Y座標が大きい）にいた方だけが反対側へ移動し、
 * もう一方はそのまま同じ側で処理する。被らなければ両者ともそのまま同じ側を維持する。
 * （同じ塔内でY座標が同値になることはない前提）
 *
 * 塔を踏まない4人（雑魚誘導・扇誘導）は優先順モードと同じ固定配置：
 * ヒーラー＝5、遠隔＝6、タンク＝7、近接＝8
 */
function resolveEven2Slot(pid, markers, steppingGroup) {
    const { cone, circ } = markerNames();
    const mine = markers[pid];
    const isStepping = steppingGroup.includes(pid);

    if (!isStepping) return escortSlot(pid);

    const mates = (state.towerMates[pid] || []).filter(p => p !== pid && steppingGroup.includes(p));
    const mySide = state.towerSide[pid];
    const sameMarkMates = mates.filter(p => markers[p] === mine);

    let goLeft;
    if (sameMarkMates.length > 0) {
        const myY = state.standingPos[pid] ? state.standingPos[pid][1] : 0;
        const iAmSouth = sameMarkMates.every(p => {
            const py = state.standingPos[p] ? state.standingPos[p][1] : 0;
            return myY > py;
        });
        // 被った場合：南側の人だけ反対の塔へ移動、北側の人はそのまま。
        goLeft = iAmSouth ? (mySide === 'R') : (mySide === 'L');
    } else {
        // 被っていなければ、前回と同じ側をそのまま維持。
        goLeft = mySide === 'L';
    }

    if (mine === circ) return goLeft ? 1 : 2;
    if (mine === cone) return goLeft ? 3 : 4;
    return goLeft ? 1 : 2;
}

function slotsToPositions(slotMap, table) {
    const used = {};
    const pos = {};
    const slots = {};
    ID.forEach(pid => {
        const s = slotMap[pid];
        slots[pid] = s;
        const base = table[s] || table[1];

        if (s === 7) {
            pos[pid] = [base[0], base[1]];
        } else {
            const n = used[s] || 0;
            used[s] = n + 1;
            pos[pid] = n === 0
                ? [base[0], base[1]]
                : [base[0] + (n % 2 ? 20 : -20), base[1] + (n > 1 ? 16 : 0)];
        }
    });
    state.standingSlot = slots;
    state.standingPos = pos;
    return pos;
}

// steppingGroup: このラウンドで実際に塔を踏む4人（groupForRound(towerNum)の結果を渡す）
// towerNum: 何回目の塔踏みか（1〜8）。8回目だけは優先順位/南調整に関係なくbind/stopタグで決まる。
function computeStandingPositions(phase, markers, steppingGroup, towerNum) {
    if (phase === 'odd') {
        const slotMap = assignOdd1Slots(markers, steppingGroup, towerNum);
        slotsToPositions(slotMap, SLOT_ODD);
    } else {
        let slotMap;
        if (towerNum === 8) {
            slotMap = assignFinalTowerSlots(steppingGroup);
        } else if (cfg.meth === 'pri' || towerNum === 4) {
            // 4回目（後組が初めて塔を踏む偶数回）は、南調整モードでも優先順と同じロジックを使う
            // （前回の塔サイド情報が存在しないため）。
            slotMap = assignEvenSlots(markers, steppingGroup);
        } else {
            slotMap = {};
            ID.forEach(pid => { slotMap[pid] = resolveEven2Slot(pid, markers, steppingGroup); });
        }
        slotsToPositions(slotMap, SLOT_EVEN);
    }
    return state.standingPos;
}

function recordTowerMates() {
    state.towerMates = {};
    state.towerSide = {};
    const left = [];
    const right = [];
    ID.forEach(pid => {
        const s = state.standingSlot[pid];
        if (s === 1 || s === 3) {
            state.towerSide[pid] = 'L';
            left.push(pid);
        } else if (s === 2 || s === 4 || s === 7) {
            state.towerSide[pid] = 'R';
            right.push(pid);
        } else {
            state.towerSide[pid] = null;
        }
    });
    left.forEach(pid => { state.towerMates[pid] = [...left]; });
    right.forEach(pid => { state.towerMates[pid] = [...right]; });
    ID.forEach(pid => {
        if (!state.towerMates[pid]) state.towerMates[pid] = [pid];
    });
}

function myCorrectXY() {
    return state.standingPos[cfg.me] || null;
}

function isClickCorrect(x, y) {
    const me = myCorrectXY();
    if (!me) return false;
    return Math.hypot(x - me[0], y - me[1]) < 30;
}

function isHard() { return cfg.difficulty === 'hard'; }

// 正解/不正解の瞬間、盤面中央に大きな○（緑）／×（赤）を一瞬表示してフェードアウトさせる
function showResultMark(ok) {
    const sv = $('sv');
    const old = sv.querySelector('.result-mark');
    if (old) old.remove();

    // 濃さ（0〜1）はCSS側の --peak-opacity で管理している（style.cssの.result-markを参照）。
    // ※ここの 0.2 は初期値の指定用なので、濃さを変えたい場合はCSS側の値を変えること。
    const g = svg('g', { class: 'result-mark', style: '--peak-opacity: 0.2' });
    const cx = C[0], cy = C[1];

    if (ok) {
        g.append(svg('circle', {
            cx, cy, r: 270,                                       // ← ○の半径（大きさ）
            fill: 'none', stroke: '#22c55e', 'stroke-width': 100   // ← ○の線の色・太さ
        }));
    } else {
        // 長方形2枚を交差させた、角の丸まっていないシャープな×
        // 不透明度はrect単体ではなくg全体にかけることで、交差部分が濃くならないようにする
        const barLen = 760;   // ← ×の長さ
        const barW = 130;     // ← ×の太さ
        [45, -45].forEach(angle => {
            g.append(svg('rect', {
                x: cx - barLen / 2, y: cy - barW / 2,
                width: barLen, height: barW,
                fill: '#ef4444',                                  // ← ×の色
                transform: `rotate(${angle} ${cx} ${cy})`
            }));
        });
    }

    sv.append(g);
    // CSS側のanimation-durationを読み取って、その時間が過ぎたら要素を消す
    // （setTimeoutの時間をCSSと手動で合わせる必要がないようにするため）
    const durationSec = parseFloat(getComputedStyle(g).animationDuration) || 0.5;
    setTimeout(() => g.remove(), durationSec * 1000);
}

// pidが今回どちらの塔（左右）にいるかを state.standingSlot から求め、
// steppingGroup（今回塔を踏む4人）の中から同じ塔にいる人（pid自身も含む）を返す。
// 南調整モードで「自分と同じ塔内の人」の予兆を表示するために使用。
function sameTowerSteppers(pid, steppingGroup) {
    const sideOf = p => {
        const s = state.standingSlot[p];
        if (s === 1 || s === 3) return 'L';
        if (s === 2 || s === 4) return 'R';
        return null;
    };
    const mySide = sideOf(pid);
    if (!mySide) return [pid];
    return steppingGroup.filter(p => sideOf(p) === mySide);
}

// 正解座標(correctXY)に一致する .pt を緑にする（不正解クリック時・タイムアウト時の共通処理）
function highlightCorrectPoint(correctXY) {
    if (!correctXY) return;
    [...$('sv').querySelectorAll('.pt')].forEach(pt => {
        const px = parseFloat(pt.getAttribute('cx'));
        const py = parseFloat(pt.getAttribute('cy'));
        if (Math.hypot(px - correctXY[0], py - correctXY[1]) < 5) {
            pt.classList.add('correct');
        }
    });
}

// Hardモードで間違えた/時間切れになった瞬間の処理：
// 全ての点をクリック不可にし（正解位置は既に緑表示済み）、
// メッセージを「ゲームオーバー」にし、「最初から」ボタンだけを表示する。
function triggerGameOver() {
    state.gameOverActive = true;
    if (state.markerTimer) { clearTimeout(state.markerTimer); state.markerTimer = null; }
    const sv = $('sv');
    [...sv.querySelectorAll('.pt')].forEach(pt => {
        pt.onclick = null;
        pt.style.pointerEvents = 'none';
    });
    $('msg').textContent = t('gameover');
    $('b-again').classList.remove('hide');
}

function ui() {
    document.documentElement.lang = cfg.lang;
    document.title = t('title');
    $('t-title').textContent = t('title');
    $('l-lang').textContent = t('lang');
    $('l-meth').textContent = t('meth');
    $('l-difficulty-text').textContent = t('difficulty');
    $('i-difficulty-tip').innerHTML = t('difficultyInfo')
        .map(m => `<span class="tip-row"><span class="tip-label">${m.label}</span>${m.desc}</span>`)
        .join('');
    $('b-go').textContent = t('go');
    $('t-hint').textContent = t('hint');
    // ラジオボタン（丸は非表示にし、選択中のものをボタンごとハイライトする見た目）を生成する
    const fillSeg = (el, name, arr, current, onChange) => {
        el.innerHTML = '';
        arr.forEach(([v, txt]) => {
            const id = `${name}-${v}`;
            const inp = document.createElement('input');
            inp.type = 'radio';
            inp.name = name;
            inp.id = id;
            inp.value = v;
            inp.checked = (v === current);
            inp.onchange = () => onChange(v);
            const lab = document.createElement('label');
            lab.htmlFor = id;
            lab.textContent = txt;
            el.append(inp, lab);
        });
    };
    fillSeg($('s-lang'), 'lang', [['ja', '日本語'], ['en', 'English']], cfg.lang, v => { cfg.lang = v; saveCfg(); ui(); });
    fillSeg($('s-meth'), 'meth', [['pri', t('m')[0]], ['south', t('m')[1]]], cfg.meth, v => { cfg.meth = v; saveCfg(); });
    fillSeg($('s-difficulty'), 'difficulty', [['normal', t('difficultyLabels')[0]], ['hard', t('difficultyLabels')[1]]], cfg.difficulty, v => { cfg.difficulty = v; saveCfg(); });
    $('c-stay').textContent = t('stay');
    $('c-south').textContent = t('south');
    $('b-again').textContent = t('again');
}

$('b-go').onclick = () => {
    $('start').classList.add('hide');
    $('game').classList.remove('hide');
    startSelectPos();
};
$('b-again').onclick = () => {
    state.run++;
    clearMarkers();
    $('game').classList.add('hide');
    $('start').classList.remove('hide');
    ui();
};

loadCfg();
ui();

// ツールチップが画面端をはみ出す場合、はみ出した分だけ横にずらして画面内に収める
function positionTooltip(icon) {
    const tip = icon.querySelector('.tooltip');
    if (!tip) return;
    tip.style.transform = '';
    const rect = tip.getBoundingClientRect();
    const margin = 8;
    let shift = 0;
    if (rect.left < margin) shift = margin - rect.left;
    else if (rect.right > window.innerWidth - margin) shift = (window.innerWidth - margin) - rect.right;
    tip.style.transform = shift ? `translateX(calc(-50% + ${shift}px))` : '';
}
document.querySelectorAll('.info-icon').forEach(icon => {
    icon.addEventListener('mouseenter', () => positionTooltip(icon));
    icon.addEventListener('focus', () => positionTooltip(icon));
});

function createMarkerIcon(type, x, y, size = 28) {
    const g = svg('g', { class: 'head-marker' });
    const r = size / 2;
    const { stack, cone } = markerNames();

    if (type === cone || type === '扇' || type === 'Cone') {
        const top = y - r, bot = y + r, left = x - r, right = x + r;
        const d = `M ${x} ${bot} L ${left} ${top + r * 0.15} Q ${x} ${top - r * 0.35} ${right} ${top + r * 0.15} Z`;
        g.append(svg('path', {
            d, fill: MARKER_FILL, stroke: MARKER_STROKE,
            'stroke-width': 2, 'stroke-linejoin': 'round'
        }));
    } else if (type === stack || type === '頭割り' || type === 'Stack') {
        // 頭割り（全員集合）マーク：上下左右から中心に向かって収束する二重矢印を十字状に配置
        // 　＞＞　　＜＜　のような見た目が上下左右の4方向にある形
        const armLen = r * 0.5;
        const armSpread = r * 0.32;
        const sw = Math.max(2, size * 0.11);
        const dists = [r * 0.46, r * 0.88];

        // backX,backY: 矢印の開いた側（外側）の中心位置。dx,dy: 先端が向く方向（中心方向の単位ベクトル）。
        const drawChevron = (backX, backY, dx, dy) => {
            const tipX = backX + dx * armLen, tipY = backY + dy * armLen;
            const px = -dy, py = dx;
            const a1x = backX + px * armSpread, a1y = backY + py * armSpread;
            const a2x = backX - px * armSpread, a2y = backY - py * armSpread;
            const d = `M ${a1x} ${a1y} L ${tipX} ${tipY} L ${a2x} ${a2y}`;
            g.append(svg('path', {
                d, fill: 'none', stroke: MARKER_STROKE, 'stroke-width': sw + 2,
                'stroke-linecap': 'round', 'stroke-linejoin': 'round'
            }));
            g.append(svg('path', {
                d, fill: 'none', stroke: MARKER_FILL, 'stroke-width': sw,
                'stroke-linecap': 'round', 'stroke-linejoin': 'round'
            }));
        };

        dists.forEach(d => drawChevron(x + d, y, -1, 0)); // 右側 → 左（中心）向き
        dists.forEach(d => drawChevron(x - d, y, 1, 0));  // 左側 → 右（中心）向き
        dists.forEach(d => drawChevron(x, y - d, 0, 1));  // 上側 → 下（中心）向き
        dists.forEach(d => drawChevron(x, y + d, 0, -1)); // 下側 → 上（中心）向き
    } else if (type) {
        g.append(svg('circle', {
            cx: x, cy: y, r: r,
            fill: MARKER_FILL, stroke: MARKER_STROKE, 'stroke-width': 2
        }));
    }
    return g;
}

// bind1/bind2/stop1/stop2 用アイコン（紫の輪＝bind、ピンクの禁止マーク＝stop）＋数字
function createTagIcon(tag, x, y, size = 28) {
    const g = svg('g', { class: 'tower-tag' });
    const r = size / 2;
    const isBind = tag.startsWith('bind');
    const num = tag.slice(-1);
    const color = isBind ? '#9333ea' : '#ec4899';
    const badgeBg = isBind ? '#6b21a8' : '#9d174d';

    if (isBind) {
        // 拘束(bind)風：紫の重なった輪っか
        g.append(svg('circle', {
            cx: x - r * 0.32, cy: y, r: r * 0.58,
            fill: 'none', stroke: color, 'stroke-width': size * 0.16
        }));
        g.append(svg('circle', {
            cx: x + r * 0.32, cy: y, r: r * 0.58,
            fill: 'none', stroke: color, 'stroke-width': size * 0.16
        }));
    } else {
        // 停止(stop)風：ピンクの禁止（通行止め）マーク
        g.append(svg('circle', {
            cx: x, cy: y, r: r * 0.85,
            fill: 'none', stroke: color, 'stroke-width': size * 0.16
        }));
        g.append(svg('line', {
            x1: x - r * 0.6, y1: y - r * 0.6, x2: x + r * 0.6, y2: y + r * 0.6,
            stroke: color, 'stroke-width': size * 0.16, 'stroke-linecap': 'round'
        }));
    }

    // 右下に数字バッジ（見やすいよう大きめに）
    g.append(svg('circle', { cx: x + r * 0.75, cy: y + r * 0.75, r: r * 0.75, fill: badgeBg }));
    g.append(svg('text', {
        x: x + r * 0.75, y: y + r * 0.75 + r * 0.45, 'text-anchor': 'middle',
        'font-size': r * 1.35, 'font-weight': 700, fill: '#fff'
    }, num));

    return g;
}

// 3回目の塔処理後に確定したbind/stopタグを、現在の立ち位置の上にずっと表示し続ける。
// 自分が後組（state.secondGroup）のときは無関係なので表示しない。
function renderPersistentTags() {
    if (!state.tagsVisible) return;
    if (!state.firstGroup.includes(cfg.me)) return;
    const sv = $('sv');
    Object.keys(state.towerTags).forEach(pid => {
        const pos = state.standingPos[pid];
        if (!pos) return;
        sv.append(createTagIcon(state.towerTags[pid], pos[0], pos[1] - 55, 36));
    });
}

// 7回目終了後専用：自分が先組で自分のbind/stopタグがあれば、自分の分だけ5秒間表示する。
// （8回目の画面ではタグを表示しないので、この一度きりの演出でしか見せない）
// 対象外（自分が後組）の場合は、従来通りdefaultMsだけ待つ。
async function revealOwnTagAfterRound7(defaultMs) {
    if (state.firstGroup.includes(cfg.me) && state.towerTags[cfg.me]) {
        const pos = state.standingPos[cfg.me];
        if (pos) {
            $('sv').append(createTagIcon(state.towerTags[cfg.me], pos[0], pos[1] - 55, 36));
        }
        await new Promise(r => setTimeout(r, 5000));
    } else {
        await new Promise(r => setTimeout(r, defaultMs));
    }
}

function clearMarkers() {
    if (state.markerTimer) {
        clearTimeout(state.markerTimer);
        state.markerTimer = null;
    }
    const sv = $('sv');
    [...sv.querySelectorAll('.head-marker')].forEach(e => e.remove());
    [...sv.querySelectorAll('.player-token')].forEach(e => e.remove());
}

function drawAllMarkersOnPos() {
    clearMarkers();
    const sv = $('sv');
    ID.forEach((pid, i) => {
        const [x, y] = POS_XY[i];
        sv.append(createMarkerIcon(state.currentMarkers[pid], x, y - 50, 26));
    });
}

// 今回塔を踏んだ組（targets）だけを表示する。
// targets が null／空なら何も表示しない＝塔を踏んでいない組には表示させない。
function showNextMarkersOnStandingPositions(durationMs = 5000, targets = null) {
    clearMarkers();
    if (!targets || targets.length === 0) return;

    const sv = $('sv');
    const list = NAME[cfg.lang];

    const byKey = {};
    targets.forEach(pid => {
        const xy = state.standingPos[pid];
        if (!xy) return;
        const key = xy[0] + ',' + xy[1];
        if (!byKey[key]) byKey[key] = [];
        byKey[key].push(pid);
    });

    Object.keys(byKey).forEach(key => {
        const group = byKey[key];
        group.forEach((pid, i) => {
            const base = state.standingPos[pid];
            const x = base[0] + (group.length > 1 ? (i - (group.length - 1) / 2) * 36 : 0);
            const y = base[1];

            const isSelf = pid === cfg.me;
            const token = svg('g', { class: 'player-token' });
            token.append(svg('circle', {
                cx: x, cy: y, r: 22,
                fill: isSelf ? ROLE_COLOR[roleOf(pid)].active : DIM_COLOR,
                stroke: 'none'
            }));
            const idx = ID.indexOf(pid);
            token.append(svg('text', {
                x, y: y + 7, 'text-anchor': 'middle',
                'font-size': 14, 'font-weight': 700,
                fill: '#fff'
            }, list[idx] || pid));
            sv.append(token);

            const type = state.currentMarkers[pid];
            if (type) sv.append(createMarkerIcon(type, x, y - 40, 24));
        });
    });

    state.markerTimer = setTimeout(() => clearMarkers(), durationMs);
}

/**
 * rotation:
 * 0 = Aが北
 * 1 = 2が北
 * 2 = Bが北
 * ...
 * 6 = Dが北
 * 7 = 1が北
 */
function build(showTowers = false, rotation = 0) {
    const sv = $('sv');
    sv.innerHTML = '';
    sv.append(svg('circle', {
        cx: C[0], cy: C[1], r: 478,
        fill: 'none', stroke: 'var(--line)', 'stroke-width': 6
    }));
    if (showTowers) {
        TOWERS.forEach(([x, y]) => {
            sv.append(svg('circle', {
                cx: x, cy: y, r: TOWER_R,
                fill: '#4a7bd633', stroke: '#4a7bd6', 'stroke-width': 3
            }));
        });
    }
    // ボスのターゲットサークル（目立たないグレーの破線で表示）
    sv.append(svg('circle', {
        cx: C[0], cy: C[1], r: 150,
        fill: 'none', stroke: '#8a8a8a', 'stroke-width': 3,
        'stroke-dasharray': '10 8', opacity: 0.5
    }));
    sv.append(svg('text', {
        x: C[0], y: C[1] + 12,
        'text-anchor': 'middle', 'font-size': 36, fill: 'var(--fg)'
    }, 'BOSS'));

    const rotatedLabels = [];
    for (let i = 0; i < 8; i++) {
        rotatedLabels.push(BASE_LABELS[(i + rotation) % 8]);
    }

    for (let i = 0; i < 8; i++) {
        const [x, y] = ang(i * 45, 430);
        sv.append(svg('text', {
            x, y: y + 14, 'text-anchor': 'middle', 'font-size': 40,
            fill: 'var(--fg)', opacity: 0.4
        }, rotatedLabels[i]));
    }

    // 偶数回のとき中央に「過去」「未来」を表示
    if (state.currentPastFuture) {
        const label = state.currentPastFuture === 'past'
            ? (cfg.lang === 'ja' ? '過去' : 'Past')
            : (cfg.lang === 'ja' ? '未来' : 'Future');
        sv.append(svg('text', {
            x: C[0],
            y: C[1] - 40,
            'text-anchor': 'middle',
            'font-size': 48,
            'font-weight': 700,
            fill: state.currentPastFuture === 'past' ? '#3b82f6' : '#ef4444',
            opacity: 0.9
        }, label));
    }
}

function createPosIcons() {
    // ポジション選択時は A が北
    state.currentPastFuture = null;
    build(false, 0);
    const sv = $('sv');
    const list = NAME[cfg.lang];
    ID.forEach((id, i) => {
        const [x, y] = POS_XY[i];
        const role = roleOf(id);
        const g = svg('g', { class: 'pos', 'data-id': id });
        g.append(svg('circle', {
            cx: x, cy: y, r: 34,
            fill: ROLE_COLOR[role].muted, stroke: 'none'
        }));
        g.append(svg('text', {
            x, y: y + 10, 'text-anchor': 'middle',
            'font-size': 22, 'font-weight': 700, fill: '#fff'
        }, list[i]));
        g.onclick = () => selectPosition(id, list[i]);
        sv.append(g);
    });
}

function selectPosition(id, displayName) {
    cfg.me = id;
    $('h2').textContent = displayName;

    state.currentMarkers = assignOpeningMarkers();
    state.firstGroup = computeFirstGroup(state.currentMarkers);
    state.secondGroup = ID.filter(pid => !state.firstGroup.includes(pid));
    state.towerMates = {};
    state.towerSide = {};
    state.towerTags = {};
    state.tagsVisible = false;
    state.currentPastFuture = null;
    // Tower 1 開始は D が北 → rotation = 6
    state.currentRotation = 6;

    [...$('sv').querySelectorAll('.pos')].forEach(g => {
        g.style.pointerEvents = 'none';
        const gid = g.getAttribute('data-id');
        const isSelected = gid === id;
        g.style.opacity = isSelected ? '1' : '0.55';
        const circle = g.querySelector('circle');
        if (circle) circle.setAttribute('fill', ROLE_COLOR[roleOf(gid)][isSelected ? 'active' : 'muted']);
    });

    $('msg').textContent = t('memorize');
    drawAllMarkersOnPos();

    const myRun = state.run;
    state.markerTimer = setTimeout(() => {
        if (myRun !== state.run) return;
        clearMarkers();
        play();
    }, 5000);
}

// correctKey: 正解のキーを明示指定する場合に使う（過去/未来のようにstandingPosと無関係な判定のとき）。
// 省略時は、塔のポイント（POINTS_ODD/POINTS_EVEN）ならstandingPosとの距離で判定し、
// それ以外（Aマーカーのような1点しかない選択肢）は常に正解扱いにする。
function waitClick(pts, ms, correctKey = null) {
    return new Promise(res => {
        const sv = $('sv');
        [...sv.querySelectorAll('.pt')].forEach(e => e.remove());
        clearMarkers();

        const seen = new Set();
        const unique = {};
        for (const k in pts) {
            const [x, y] = pts[k];
            const key = Math.round(x) + ',' + Math.round(y);
            if (seen.has(key)) continue;
            seen.add(key);
            unique[k] = [x, y];
        }

        let timer;
        let answered = false;
        const done = (result) => {
            if (answered) return;
            answered = true;
            clearTimeout(timer);
            res(result);
        };

        const isTowerPoints = (pts === POINTS_ODD || pts === POINTS_EVEN);
        // 正解位置：塔のポイントはstandingPos、correctKey指定時はそのキーの座標、それ以外はなし（常に正解）
        const correctXY = isTowerPoints ? myCorrectXY() : (correctKey != null ? pts[correctKey] : null);

        for (const k in unique) {
            const [x, y] = unique[k];
            const c = svg('circle', { cx: x, cy: y, r: 17, class: 'pt' });
            c.onclick = () => {
                if (answered) return;

                let ok;
                if (correctKey != null) ok = (k === correctKey);
                else if (isTowerPoints) ok = isClickCorrect(x, y);
                else ok = true;

                // クリックした点を赤 or 緑
                c.classList.add(ok ? 'correct' : 'wrong');

                // 不正解時：正しい位置を緑にする
                if (!ok) highlightCorrectPoint(correctXY);

                // ○×はクリックした瞬間に即表示する（結果確定自体は400ms後）
                showResultMark(ok);

                setTimeout(() => done({ key: k, x, y, ok }), 400);
            };
            sv.append(c);
        }
        if (ms) timer = setTimeout(() => {
            // 時間切れ＝不正解扱い。正しい位置を緑にしてから不正解の結果を返す。
            highlightCorrectPoint(correctXY);
            showResultMark(false);
            done({ key: null, x: null, y: null, ok: false, timeout: true });
        }, ms);
    });
}

function startSelectPos() {
    clearMarkers();
    $('msg').textContent = t('selectPos');
    $('h1').textContent = '';
    $('h2').textContent = '';
    $('b-again').classList.add('hide');
    $('choice').classList.add('hide');
    state.currentRotation = 0;
    state.currentPastFuture = null;
    createPosIcons();
}

async function play() {
    const id = ++state.run;
    state.gameOverActive = false;
    // Tower 1: D が北
    state.currentRotation = 6;
    state.currentPastFuture = null;
    build(true, state.currentRotation);
    clearMarkers();

    // towerNum: このフェーズが何回目の塔踏みか（1〜8）。過去/未来・最終判定は null。
    async function doPhase(label, points, isOdd = null, rotateAfter = false, towerNum = null) {
        if (id !== state.run || state.gameOverActive) return false;

        // bind/stopタグの表示切り替え：4回目開始時に隠す（8回目では表示しない）
        if (towerNum === 4) state.tagsVisible = false;

        $('h1').textContent = label;
        $('msg').textContent = t('clickPoint');

        // 偶数回の塔のときだけ過去/未来を決定して表示
        if (isOdd === false) {
            if (!state.currentPastFuture) {
                state.currentPastFuture = Math.random() < 0.5 ? 'past' : 'future';
            }
        } else if (isOdd === true) {
            state.currentPastFuture = null;
        }
        // isOdd === null（過去未来・最終）は現在の state.currentPastFuture を維持

        build(true, state.currentRotation);

        // 今回塔を踏む組（過去/未来フェーズは towerNum が null なので steppingGroup も null＝非表示）。
        // 正解判定(state.standingPos)に使うので、waitClickより前に必ず確定させる。
        const steppingGroup = towerNum != null ? groupForRound(towerNum) : null;

        if (isOdd === true) {
            computeStandingPositions('odd', state.currentMarkers, steppingGroup, towerNum);
        } else if (isOdd === false) {
            computeStandingPositions('even', state.currentMarkers, steppingGroup, towerNum);
        }
        renderPersistentTags();

        // 過去/未来（全員同じ1点に行く）：過去→南、未来→北 が正解
        const correctKey = (points === POINTS_PAST_FUTURE)
            ? (state.currentPastFuture === 'past' ? 'south' : 'north')
            : null;

        const result = await waitClick(points, isHard() ? 6500 : 0, correctKey);
        if (id !== state.run) return false;

        // Hardモード：間違い・時間切れの瞬間にゲームオーバー（以降のフェーズは進行しない）
        if (isHard() && result && !result.ok) {
            triggerGameOver();
            return 'GAMEOVER';
        }

        // 表示対象（塔を踏む4人全員ではない）。
        // 優先順モード：自分とペアの人。南調整モード：自分と同じ塔内にいる人。
        // 自分が今回の塔要員でなければ何も表示しない。
        const iAmStepping = !!(steppingGroup && steppingGroup.includes(cfg.me));
        const displayTargets = !iAmStepping ? null
            : cfg.meth === 'south'
                ? sameTowerSteppers(cfg.me, steppingGroup)
                : [cfg.me, PAIR[cfg.me]].filter(Boolean);
        // 7回目＝後組(state.secondGroup)最後の塔、8回目＝先組(state.firstGroup)最後の塔。
        // どちらも次に同じ組が塔を踏むことはないため、予兆の張り替え・表示は行わない。
        const isLastTower = towerNum === 7 || towerNum === 8;

        if (result) {
            const ok = result.ok;
            $('msg').textContent = ok ? t('ok') : t('ng');

            if (isOdd !== null && !isLastTower) {
                recordTowerMates();
                if (steppingGroup && steppingGroup.length === 4) {
                    reassignAfterTower(steppingGroup, isOdd ? 'odd' : 'even');
                }
                // 正解位置に次予兆を表示（正解時4000ms／不正解時3500ms）
                showNextMarkersOnStandingPositions(ok ? 4000 : 3500, displayTargets);
                if (towerNum === 3) {
                    // 更新された予兆マークが表示されてから3秒後にbind/stopタグを付与
                    await new Promise(r => setTimeout(r, 3000));
                    assignTowerTags(steppingGroup, state.currentMarkers);
                    state.tagsVisible = true;
                    renderPersistentTags();
                    await new Promise(r => setTimeout(r, ok ? 1000 : 500));
                } else {
                    await new Promise(r => setTimeout(r, ok ? 4000 : 3500));
                }
            } else if (towerNum === 7) {
                await revealOwnTagAfterRound7(ok ? 800 : 1500);
            } else {
                await new Promise(r => setTimeout(r, ok ? 800 : 1500));
            }

            if (rotateAfter) {
                state.currentRotation = (state.currentRotation + 1) % 8;
            }
            return ok;
        }
        return false;
    }

    // ========== フルフロー ==========
    // 各フェーズの設定を配列にまとめ、ループで順に実行する（doPhaseの呼び出しパターン自体は変更なし）
    const phases = [
        { label: 'Tower 1/8 (Odd)', points: POINTS_ODD, isOdd: true, rotateAfter: true, towerNum: 1 },
        { label: 'Tower 2/8 (Even)', points: POINTS_EVEN, isOdd: false, rotateAfter: true, towerNum: 2 },
        { label: 'Past / Future 1', points: POINTS_PAST_FUTURE, isOdd: null, rotateAfter: false, towerNum: null, resetPastFutureAfter: true },
        { label: 'Tower 3/8 (Odd)', points: POINTS_ODD, isOdd: true, rotateAfter: true, towerNum: 3 },
        { label: 'Tower 4/8 (Even)', points: POINTS_EVEN, isOdd: false, rotateAfter: true, towerNum: 4 },
        { label: 'Past / Future 2', points: POINTS_PAST_FUTURE, isOdd: null, rotateAfter: false, towerNum: null, resetPastFutureAfter: true },
        { label: 'Tower 5/8 (Odd)', points: POINTS_ODD, isOdd: true, rotateAfter: true, towerNum: 5 },
        { label: 'Tower 6/8 (Even)', points: POINTS_EVEN, isOdd: false, rotateAfter: true, towerNum: 6 },
        { label: 'Past / Future 3', points: POINTS_PAST_FUTURE, isOdd: null, rotateAfter: false, towerNum: null, resetPastFutureAfter: true },
        { label: 'Tower 7/8 (Odd)', points: POINTS_ODD, isOdd: true, rotateAfter: true, towerNum: 7 },
        // Tower 8: Aが北・回転しない
        { label: 'Tower 8/8 (Even)', points: POINTS_EVEN, isOdd: false, rotateAfter: false, towerNum: 8, resetRotationBefore: true },
        { label: 'Past / Future 4 (A side)', points: POINTS_PAST_FUTURE_A, isOdd: null, rotateAfter: false, towerNum: null }
    ];

    for (const ph of phases) {
        if (ph.resetRotationBefore) state.currentRotation = 0;
        await doPhase(ph.label, ph.points, ph.isOdd, ph.rotateAfter, ph.towerNum);
        if (id !== state.run || state.gameOverActive) return;
        if (ph.resetPastFutureAfter) state.currentPastFuture = null;
    }

    // 最後の過去/未来の特別処理：北寄りの点＝とどまる、南寄りの点＝南側へ移動。
    // 過去なら「とどまる」、未来なら「南側へ移動」が正解。
    const wantChoice = state.currentPastFuture === 'past' ? 'stay' : 'south';
    $('h1').textContent = 'Final Choice (Stay or South)';
    $('msg').textContent = t('clickPoint');
    build(true, state.currentRotation);
    const finalResult = await waitClick(POINTS_FINAL_CHOICE, isHard() ? 5000 : 0, wantChoice);
    if (id !== state.run || state.gameOverActive) return;

    if (isHard() && finalResult && !finalResult.ok) {
        triggerGameOver();
        return;
    }

    if (finalResult && finalResult.ok) {
        $('msg').textContent = t('ok');
        await new Promise(r => setTimeout(r, 800));
    } else {
        $('msg').textContent = t('ng');
        await new Promise(r => setTimeout(r, 1500));
    }
    state.currentPastFuture = null;

    clearMarkers();
    $('msg').textContent = t('clr');
    $('b-again').classList.remove('hide');
}

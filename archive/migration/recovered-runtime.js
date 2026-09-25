// 恢复来源 c2.js SHA-256: b9dd4f566645cdc252a5340ad1d89262a6a7c2e1d2cbc5d4db36d89113222153
// 由 npm run recover 生成。不要将短变量名视为已经恢复的原始命名。
import monstersAtlas from '../data/monsters-atlas.js';
import terrainAtlas from '../data/terrain-atlas.js';
import itemsAtlas from '../data/items-atlas.js';
import fa from './save-codec.js';
let persistence = { read: () => null, write: () => {}, remove: () => {} };
'use strict';
var e;
var aa = monstersAtlas;
function ga(a) {
    this.Xc = 624;
    this.Gq = 397;
    this.uy = 2567483615;
    this.Kt = 2147483648;
    this.Jt = 2147483647;
    this.jd = Array(this.Xc);
    this.hg = this.Xc + 1;
    this.sE = 1 / 4294967296;
    this.jd[0] = a & 4294967295;
    for (this.hg = 1; this.hg < this.Xc; this.hg++) this.jd[this.hg] = 1812433253 * (this.jd[this.hg - 1] ^ this.jd[this.hg - 1] >> 30) + this.hg,
    this.jd[this.hg] &= 4294967295;
    this.tp = [0, this.uy]
}
ga.prototype.random = function() {
    var a;
    this.tp[0] = 0;
    this.tp[1] = this.uy;
    if (this.hg >= this.Xc) {
        var b;
        for (b = 0; b < this.Xc - this.Gq; b++) a = this.jd[b] & this.Kt | this.jd[b + 1] & this.Jt,
        this.jd[b] = this.jd[b + this.Gq] ^ a >>> 1 ^ this.tp[a & 1];
        for (; b < this.Xc - 1; b++) a = this.jd[b] & this.Kt | this.jd[b + 1] & this.Jt,
        this.jd[b] = this.jd[b + (this.Gq - this.Xc)] ^ a >>> 1 ^ this.tp[a & 1];
        a = this.jd[this.Xc - 1] & this.Kt | this.jd[0] & this.Jt;
        this.jd[this.Xc - 1] = this.jd[this.Gq - 1] ^ a >>> 1 ^ this.tp[a & 1];
        this.hg = 0
    }
    a = this.jd[this.hg++];
    a ^= a >>> 11;
    a ^= a << 7 & 2636928640;
    a ^= a << 15 & 4022730752;
    return ((a ^ a >>> 18) >>> 0) * this.sE
};
function ma(a, b) {
    return a.random() * b | 0
};
function oa() {
    this.Im = [[1, 1, 0], [ - 1, 1, 0], [1, -1, 0], [ - 1, -1, 0], [1, 0, 1], [ - 1, 0, 1], [1, 0, -1], [ - 1, 0, -1], [0, 1, 1], [0, -1, 1], [0, 1, -1], [0, -1, -1]];
    this.Wj = [];
    this.HB = Math.sqrt(3)
};
function k(a) {
    return 0 >= a ? 0 : m(Math.random() * a)
};
function ra(a, b) {
    return - 1 !== a.indexOf(b, a.length - b.length)
};
function ua(a) {
    return 1E4 > a ? "" + m(a) : 1E5 > a ? (a / 1E3).toFixed(1) + "K": 1E6 > a ? m(a / 1E3) + "K": 1E7 > a ? (a / 1E6).toFixed(2) + "M": 1E8 > a ? (a / 1E6).toFixed(1) + "M": 1E9 > a ? m(a / 1E6) + "M": 1E10 > a ? (a / 1E9).toFixed(2) + "B": 1E11 > a ? (a / 1E9).toFixed(1) + "B": 1E12 > a ? m(a / 1E9) + "B": 1E13 > a ? (a / 1E12).toFixed(2) + "T": 1E14 > a ? (a / 1E12).toFixed(1) + "T": 1E15 > a ? m(a / 1E12) + "T": 1E16 > a ? (a / 1E15).toFixed(2) + "P": 1E17 > a ? (a / 1E15).toFixed(1) + "P": 1E18 > a ? m(a / 1E15) + "P": 1E19 > a ? (a / 1E18).toFixed(2) + "P": 1E20 > a ? (a / 1E18).toFixed(1) + "P": 1E21 > a ? m(a / 1E18) + "P": 1E22 > a ? (a / 1E21).toFixed(2) + "Z": 9.999999999999999E22 > a ? (a / 1E21).toFixed(1) + "Z": 1E24 > a ? m(a / 1E21) + "Z": 1E25 > a ? (a / 1E24).toFixed(2) + "Y": 1E26 > a ? (a / 1E24).toFixed(1) + "Y": 1E27 > a ? m(a / 1E24) + "Y": a.toFixed(0)
}
function r(a) {
    return 0 <= a ? ua(a) : "-" + ua( - a)
}
function xa(a) {
    var b = parseInt(Math.abs( + a || 0)) + "",
    c = 3 < b.length ? b.length % 3 : 0;
    return (0 > a ? "-": "") + (c ? b.substr(0, c) + ",": "") + b.substr(c).replace(/(\d{3})(?=\d)/g, "$1,")
};
function m(a) {
    return 2147483648 > a ? a | 0 : Math.floor(a)
};
var ya = 1E3 / 60;
function Ba() {
    return Date.now ? Date.now() : (new Date).valueOf()
};
function Ia(a, b, c) {
    a = Math.max(0, a - 1);
    return m(c * (b.Xd + b.Ed * Math.pow(a, b.Fd) * Math.pow(b.Vd, a)))
}
function Oa(a, b, c) {
    a = Ia(a, b, c);
    b = 1.1 - 0.2 * Math.random();
    return m(a * b)
};
function Pa(a, b, c) {
    a = (a << 5) - a + b;
    a &= a;
    a = (a << 5) - a + c;
    return a & a
};
function Ta(a, b) {
    "undefined" != typeof ganal && ganal("send", "event", a, b)
};
function Za() {
    this.U = this.T = 0
}
function $a(a, b) {
    a.T = b.T;
    a.U = b.U
}
function t(a, b, c) {
    a.T = b;
    a.U = c
}
function ab(a, b) {
    a.T = b.T;
    a.U = b.U
}
function ib(a, b) {
    a.T += b.T;
    a.U += b.U
}
function tb(a, b) {
    a.T -= b.T;
    a.U -= b.U
}
Za.prototype.ac = function(a) {
    var b = this.T - a.T;
    a = this.U - a.U;
    return Math.sqrt(b * b + a * a)
};
function Jb(a, b, c) {
    b = a.T - b;
    a = a.U - c;
    return Math.sqrt(b * b + a * a)
}
Za.prototype.Ud = function(a) {
    var b = this.T - a.T;
    a = this.U - a.U;
    return b * b + a * a
};
function Kb(a, b, c) {
    b = a.T - b;
    a = a.U - c;
    return b * b + a * a
}
function Lb(a) {
    return Math.sqrt(a.T * a.T + a.U * a.U)
}
function Mb(a) {
    var b = a.T * a.T + a.U * a.U;
    0 < b && (b = 1 / Math.sqrt(b), a.T *= b, a.U *= b)
}
function Nb(a, b) {
    a.T *= b;
    a.U *= b
}
Za.prototype.toString = function() {
    return "(" + this.T + ", " + this.U + ")"
};
function Ob(a, b, c, d) {
    this.Ad = a;
    this.ub = b;
    this.vb = c;
    this.name = d
}
Ob.prototype.getName = function() {
    return this.name
};
Ob.prototype.Hj = function() {
    return this.Ad.Hj()
};
function Pb(a, b, c) {
    this.loaded = !1;
    this.ue = b;
    this.Yh = {};
    var d = this;
    this.Il = new Image;
    this.Il.onload = function() {
        d.$w(c);
        d.loaded = !0
    };
    this.Il.src = a
}
Pb.prototype.$w = function(a) {
    var b, c;
    for (b = 0; b < a.length; b++) c = a[b],
    this.Yh[c.a] = new Ob(this, c.b.x, c.b.y, c.a)
};
Pb.prototype.v = function(a) {
    return this.Yh[a]
};
Pb.prototype.Hj = function() {
    return this.Il
};
Pb.prototype.cl = function() {
    return this.loaded
};
function Qb(a, b, c, d, f, g, h, l) {
    this.Ad = a;
    this.animationName = b;
    this.zc = l;
    a = [];
    var n, p, s;
    b = 0;
    var u;
    l = this.Ad.ue;
    for (n = d; n <= g; n++) for (s = n * l, u = n < g ? h: Math.min(f, h), d = c; d <= u; d++) p = d * l,
    a.push(new Rb(b++, p, s));
    this.qq = a
}
Qb.prototype.Hj = function() {
    return this.Ad.Hj()
};
Qb.prototype.To = function() {
    return this.qq.length
};
function Rb(a, b, c) {
    this.oc = a;
    this.qt = b;
    this.rt = c
};
function Wb(a, b, c, d) {
    this.loaded = !1;
    this.fileName = a;
    this.ue = b;
    this.Yh = {};
    this.FB = [];
    var f = this;
    this.Il = new Image;
    this.Il.onload = function() {
        f.$w(c, d);
        f.loaded = !0
    };
    this.Il.src = a
}
Wb.prototype.$w = function(a, b) {
    var c, d;
    for (c = 0; c < a.length; c++) d = a[c],
    this.FB.push(d.animationName),
    this.Yh[d.animationName] = new Qb(this, d.animationName, d.O, d.P, d.M, d.N, b, d.zc)
};
Wb.prototype.Zg = function(a) {
    return this.Yh[a]
};
Wb.prototype.Hj = function() {
    return this.Il
};
Wb.prototype.cl = function() {
    return this.loaded
};
function Xb(a) {
    this.Yh = null;
    this.Zt = a
}
Xb.prototype.Zg = function(a) {
    var b = this.Yh[a];
    return b ? b.Zg(a) : null
};
Xb.prototype.cl = function() {
    var a;
    for (a = 0; a < this.Zt.length; a++) if (!this.Zt[a].cl()) return ! 1;
    if (!this.Yh) {
        a = this.Zt;
        var b, c, d, f, g = {};
        for (b = 0; b < a.length; b++) for (d = a[b], f = d.FB, c = 0; c < f.length; c++) g[f[c]] && console.log("effect name already defined: " + f[c]),
        g[f[c]] = d;
        this.Yh = g
    }
    return ! 0
};
var Yb = 3;
function Zb(a, b, c, d, f) {
    this.ca = a;
    this.Io = f;
    this.ew = this.ud = null;
    this.li = 0;
    d ? (f = new Za, $a(f, b)) : f === Yb ? (f = new Za, $a(f, c)) : f = c;
    this.iD = b;
    this.wm = f;
    this.xi = c;
    this.Pk = !1;
    this.Xb = d;
    this.bg = this.Cj = this.Gs = !1;
    this.nd = a ? w.Dj.Zg(a) : null;
    a && !this.nd && console.log("Failed to find animated sprite: " + a);
    this.De = this.nd ? this.nd.To() : 0;
    this.bx = -1;
    this.oc = 0;
    this.nd && this.nd.zc && (this.oc = $b(this));
    this.yi = 0;
    this.uA = !1
}
var ic = new Za;
function $b(a) {
    ab(ic, a.xi);
    tb(ic, a.wm);
    Mb(ic);
    a = ic.T;
    var b = ic.U,
    c = 180 * -Math.atan2(b, a) / Math.PI;
    0 > c && (c += 360);
    if (337.5 <= c || 22.5 > c) return 3;
    if (22.5 <= c && 67.5 > c) return 2;
    if (67.5 <= c && 112.5 > c) return 1;
    if (112.5 <= c && 157.5 > c) return 0;
    if (157.5 <= c && 202.5 > c) return 7;
    if (202.5 <= c && 247.5 > c) return 6;
    if (247.5 <= c && 292.5 > c) return 5;
    if (292.5 <= c && 337.5 > c) return 4;
    console.log("direction fail x=" + a + " y=" + b + " angle=" + c)
}
Zb.prototype.Zg = function() {
    return this.nd
};
Zb.prototype.qB = function(a) {
    this.li = a
};
Zb.prototype.bl = function() {
    return this.bg || this.Pk
};
function jc(a, b) {
    a.yi += b * ya;
    var c = a.Xb ? kc: lc;
    a.bx = a.oc;
    if (a.yi >= c) {
        var d = Math.min(1, m(a.yi / c));
        a.yi = Math.max(0, m(a.yi % c));
        a.oc += d;
        a.oc >= a.De && (a.uA ? a.ud.Ja.Kf ? a.oc = 0 : a.bg = !0 : a.Xb ? a.oc = 0 : a.bg = !0)
    }
}
Zb.prototype.To = function() {
    return this.De
};
function oc() {
    var a = w.df;
    if (0 < a.Wg.length) {
        var b;
        for (b = 0; b < a.Wg.length; b++) {
            var c = a.Wg[b];
            c.bg = !0;
            c.Pk = !0
        }
        a.Wg.length = 0
    }
}
function pc(a, b) {
    b && a.Wg.push(b)
};
var xc = 19,
yc = 18,
zc = 100,
Ac = 100;
function Bc(a) {
    this.wa = a;
    this.yy = "可恶的 遗弃的 讨厌的 诅咒的 有害的 血腥的 痛苦的 诅咒的 毁坏的 矛盾的 爬行的 该死的 破旧的 厌恶的 黑暗的 昏暗的 遗弃的 发狂的 死亡的 深渊的 积灰的 不安的 荒凉的 潮湿的 粗短的 恶心的 不安的 害怕的 犯规的 禁止的 不好的 遗忘的 肮脏的 可怕的 灰暗的 地狱的 可恨的 可怕的 潮湿的 感染的 感染的 地狱的 有害的 诽谤的 可憎的 厌恶的 失去的 发霉的 神秘的 无情的 雾霾的 下流的 不好的 崩坏的 恶心的 调皮的 正常的 恶臭的 讨厌的 可憎的 厌恶的 反对的 有毒的 苍白的 污染的 腐坏的 毁灭的 糟糕的 腐臭的 驱蚊的 敌对的 发散的 恶心的 恶臭的 腐臭的 破碎的 恶心的 笼罩的 悲伤的 秘密的 阴影的 折磨的 折磨的 邪恶的 未知的 无名的 邪恶的 低语的 邪恶的".split(" ");
    this.FA = "地洞 地窖 洞穴 窑洞 空洞 兽穴 深洞 迷宫 陵墓 墓穴 迷宫 沼泽 矿坑 通道 矿井 地道 底层 地穴 水坑 隧道".split(" ");
    this.cz = "地下墓穴 地窖 膛室 窄小通道 停尸房 土窖 坟墓 石窟 地狱 阴间 陵墓 太平间 墓地 藏骨堂 神圣庇护所 埋葬所 坟墓 拱顶".split(" ");
    this.xr = "庇护所;屠宰场;地牢;暗黑;次元;领域;熔炉;地狱;地下密牢;深渊;监狱;屠宰场;刑讯室;拱顶".split(";");
    this.zC = "钟楼 城堡 监视哨 尖塔 巨石 方尖碑 柱子 避难所 矮塔 高塔 炮塔 堡垒".split(" ");
    this.TB = "修道院 皇宫 大教堂 礼拜堂 女修道院 高坛 内阁 大使馆 讲台 万神殿 小修道院 圣物箱 圣堂 密室 圣殿 圣庙 神殿 寺庙".split(" ");
    this.cB = "石冢 纪念碑 大厦 巨石 古迹 纪念馆 纪念堂 土堆 方尖碑 金字塔 宫殿 悬崖 古迹 神殿 献祭场 坟墓 遗迹".split(" ");
    this.My = "城堡 堡垒 城塞 城堡 酒庄 房产 堡垒 要塞 防务 边塞 军防 礼堂 防务 舱室 保管室 宅邸 庄园 宫殿 大厦 大本营 别墅".split(" ");
    this.Xz = "北极的;敏锐的;痛苦的;寒冷的;冷冻的;严寒的;冰冻的;霜冻的;冻结的;寒冬的;冰寒的;冰川的;冰镇的;冰冷的;冻僵的;霜降的;雪白的;刺骨的;麻木的;颤抖的;下雪的".split(";")
}
function Cc(a, b) {
    var c;
    a: switch (b) {
    case 3:
        c = a.Xz[ma(a.wa, a.Xz.length)];
        break a;
    default:
        c = a.yy[ma(a.wa, a.yy.length)]
    }
    return "" + c + "" + Dc(a, b)
}
function Dc(a, b) {
    switch (b) {
    case 0:
    case 2:
    case 3:
    case 1:
        return a.FA[ma(a.wa, a.FA.length)];
    case 4:
    case 5:
        return a.zC[ma(a.wa, a.zC.length)];
    case 6:
        return a.xr[ma(a.wa, a.xr.length)];
    case 7:
    case 8:
        return a.cB[ma(a.wa, a.cB.length)];
    case 9:
        return a.cz[ma(a.wa, a.cz.length)];
    case 10:
        return a.TB[ma(a.wa, a.TB.length)];
    case 11:
        return a.My[ma(a.wa, a.My.length)];
    default:
        return a.xr[ma(a.wa, a.xr.length)]
    }
};
function Hc(a, b, c) {
    this.io = a;
    this.Hd = b;
    this.Id = c;
    this.cu = null
};
function Ic(a, b, c, d, f, g) {
    this.lo = a;
    this.mi = b;
    this.ZC = c;
    this.$C = d;
    this.dm = f;
    this.em = g;
    this.Bj = this.cb = !1;
    this.$b = !0;
    this.ye = !1;
    this.Jf = this.yk = 0;
    this.ck = [];
    this.Ab = []
}
Ic.prototype.tx = function(a) {
    this.cb = a
};
function Jc(a) {
    return ! a.$b && !a.cb && a.Bj && !a.ye
}
Ic.prototype.Is = function() {
    Kc(this)
};
function Kc(a) {
    if (a.Bj || a.cb) a.yk = a.Ab.length;
    else {
        var b;
        for (b = a.yk = 0; b < a.Ab.length; b++) a.Ab[b].cb && a.yk++;
        a.yk === a.Ab.length && (a.Bj = !0, b = w.kb, b.Uj++, a.Jf = b.Uj, Lc());
        Jc(a) && Pc(a)
    }
}
Ic.prototype.er = function() {
    return Pa(this.ZC, this.$C, 1)
};
function Qc() {
    this.BA = w.Pe.Rh;
    this.EA = w.Pe.Sh;
    var a = w.Pe;
    this.$D = a.Rh + a.Eh;
    a = w.Pe;
    this.bE = a.Sh + a.Eh
}
function Rc(a, b, c, d) {
    return b - 1 >= a.BA && (a = b - 1 + "_" + c, !d[a]) ? w.Pe.sk[a] : null
}
function Sc(a, b, c, d) {
    return b + 1 < a.$D && (a = b + 1 + "_" + c, !d[a]) ? w.Pe.sk[a] : null
}
function Wc(a, b, c, d) {
    return c - 1 >= a.EA && (a = b + "_" + (c - 1), !d[a]) ? w.Pe.sk[a] : null
}
function Xc(a, b, c, d) {
    return c + 1 < a.bE && (a = b + "_" + (c + 1), !d[a]) ? w.Pe.sk[a] : null
}
function Yc(a, b, c, d) {
    var f = b.Hd;
    b = b.Id;
    if (0.5 > d.random()) if (0.5 > d.random()) {
        if ((d = Rc(a, f, b, c)) || (d = Sc(a, f, b, c)) || (d = Xc(a, f, b, c))) return d;
        d = Wc(a, f, b, c)
    } else {
        if ((d = Sc(a, f, b, c)) || (d = Rc(a, f, b, c)) || (d = Wc(a, f, b, c))) return d;
        d = Xc(a, f, b, c)
    } else if (0.5 > d.random()) {
        if ((d = Wc(a, f, b, c)) || (d = Xc(a, f, b, c)) || (d = Sc(a, f, b, c))) return d;
        d = Rc(a, f, b, c)
    } else {
        if ((d = Xc(a, f, b, c)) || (d = Wc(a, f, b, c)) || (d = Rc(a, f, b, c))) return d;
        d = Sc(a, f, b, c)
    }
    if (d) return d
};
function Zc() {
    var a = w.kb;
    a.Jg.length = 0;
    a.Dh.length = 0;
    a.cm = 0;
    a.Uj = 1;
    var b;
    for (b = 0; b < a.pd.length; b++) {
        var c = a.pd[b];
        c.cb = !1;
        c.$b = !0;
        c.ye = !1;
        c.yk = 0;
        c.Jf = 0;
        c.Bj = 0 === c.Ab.length
    }
}
function cd() {
    var a = w.S.q[1][1],
    a = a.Hd + "_" + a.Id,
    b = dd(a);
    b ? (b.$b = !1, ed(w.S)) : console.log("failed to find world block owner castle: " + a)
}
function fd(a) {
    return (a = w.kb.bm[a]) ? a: null
}
function dd(a) {
    return (a = w.kb.ju[a]) ? a: null
}
function Pc(a) {
    var b = w.kb;
    b.cm++;
    var c = b.Jg.indexOf(a);
    Jc(a) ? 0 > c && (b.Jg.push(a), md(b, b.Jg)) : -1 < c && b.Jg.splice(c, 1)
}
function nd(a) {
    var b = w.kb;
    b.cm++;
    var c = b.Dh.indexOf(a);
    a.ye ? 0 > c && (b.Dh.push(a), md(b, b.Dh)) : -1 < c && b.Dh.splice(c, 1)
}
function Lc() {
    w.kb.cm++
}
function md(a, b) { ! b || 2 > b.length || b.sort(a.GE)
};
function od(a) {
    switch (a) {
    case 0:
        return pd;
    case 1:
        return pd;
    case 2:
        return qd;
    case 3:
        return rd;
    case 4:
        return sd;
    case 5:
        return td;
    case 6:
        return ud;
    case 7:
        return sd;
    case 8:
        return Bd;
    case 9:
        return Cd;
    case 10:
        return Dd;
    case 11:
        return Ed;
    default:
        return Dd
    }
}
function Fd(a) {
    switch (a) {
    case 0:
        return "L2_Terrain068.PNG";
    case 1:
        return "L2_Terrain070.PNG";
    case 2:
        return "L2_Terrain069.PNG";
    case 3:
        return "L2_Terrain071.PNG";
    case 4:
        return "L2_Terrain081.PNG";
    case 5:
        return "L2_Terrain082.PNG";
    case 6:
        return "L2_DungeonE.PNG";
    case 7:
        return "L2_Terrain090.PNG";
    case 8:
        return "L2_Terrain091.PNG";
    case 9:
        return "L2_Terrain095.PNG";
    case 10:
        return "L2_Terrain099.PNG";
    default:
        return "L2_Terrain068.PNG"
    }
};
function Gd(a, b, c, d, f, g, h, l, n) {
    this.ag = a;
    this.Eo = b;
    this.Go = c;
    this.Nk = 0;
    this.Aj = !(4 === c || 5 === c || 7 === c || 8 === c);
    this.Fo = Fd(c);
    this.cb = this.oe = this.Lc = this.qf = !1;
    this.zi = this.Mg = 0;
    this.Qn = d;
    this.Tn = f;
    this.WE = g;
    this.XE = h;
    this.rs = l;
    this.ri = 0;
    this.zj = n
}
e = Gd.prototype;
e.tx = function(a) {
    this.cb = a
};
e.dc = function() {
    return w.S.dc(this.Qn)
};
e.ec = function() {
    return w.S.ec(this.Tn)
};
e.bc = function() {
    return this.Qn
};
e.cc = function() {
    return this.Tn
};
e.vw = function() {
    return this.WE
};
e.ww = function() {
    return this.XE
};
function Hd(a) {
    return a.qf && a.cb && !a.oe && a.zj.cb
}
e.er = function() {
    return Pa(this.Qn, this.Tn, this.ri)
};
e.iw = function() {
    this.ri++;
    Id();
    w.i.aa.$r();
    if (this.ri < this.rs) Jd(this.er(), this.Go, this.Aj, !0),
    Kd(Ld),
    Ta("Dungeon", "进入等级" + this.ri);
    else {
        w.Mc = null;
        this.cb = this.Lc = w.wb = !0;
        this.Mg = w.i.$a;
        w.Aa.Is(this);
        this.zj.Is();
        w.i.aa.Vr();
        Kd(Pd);
        Ta("Dungeon", "Dungeon Cleared");
        var a, b, c = Qd(),
        d;
        for (a = 0; a < c.length; a++) d = c[a],
        b = d.p,
        Rd(b),
        b.cd = null,
        b.w = null,
        d.Y = Sd;
        $d()
    }
};
function ae(a) {
    switch (ma(a, 11)) {
    case 0:
        return 0;
    case 1:
        return 1;
    case 2:
        return 2;
    case 3:
        return 3;
    case 4:
        return 4;
    case 5:
        return 5;
    case 6:
        return 6;
    case 7:
        return 7;
    case 8:
        return 8;
    case 9:
        return 9;
    case 10:
        return 10;
    default:
        return 0
    }
};
function be() {
    this.Ab = [];
    this.Do = {};
    this.Mk = 0;
    this.Ge = [];
    this.ze = [];
    this.dg = [];
    this.uj = [];
    this.bk = [];
    this.lt = !0;
    this.Sd = 0;
    this.EE = function(a, b) {
        return m(a.Nk * ce.t) < m(b.Nk * ce.t) ? -1 : 1
    }
}
function de() {
    var a = w.Aa;
    a.uj.length = 0;
    a.Ge.length = 0;
    a.ze.length = 0;
    a.dg.length = 0;
    a.bk.length = 0;
    a.Mk = 0;
    a.Sd = 0;
    var b;
    for (b = 0; b < a.Ab.length; b++) {
        var c = a.Ab[b];
        c.qf = !1;
        c.Lc = !1;
        c.cb = !1;
        c.oe = !1;
        c.zi = 0;
        c.Mg = 0
    }
}
be.prototype.dt = function(a) {
    this.Sd = a
};
function ee(a) {
    var b = w.Aa;
    0 > b.uj.indexOf(a) && (b.uj.push(a), b.Mk++);
    a.qf && !a.Lc && !a.oe && 0 > b.Ge.indexOf(a) && (b.Ge.push(a), fe(b, b.Ge));
    ge(b, a)
}
be.prototype.Is = function(a) {
    0 > this.ze.indexOf(a) && (this.ze.push(a), fe(this, this.ze));
    var b = this.Ge.indexOf(a); - 1 < b && this.Ge.splice(b, 1);
    ge(this, a)
};
function ge(a, b) {
    var c = a.bk.indexOf(b);
    Hd(b) ? 0 > c && (a.bk.push(b), fe(a, a.bk)) : -1 < c && a.bk.splice(c, 1)
}
function he(a) {
    var b = w.Aa;
    0 > b.dg.indexOf(a) && (b.dg.push(a), fe(b, b.dg));
    var c = b.Ge.indexOf(a); - 1 < c && b.Ge.splice(c, 1);
    c = b.ze.indexOf(a); - 1 < c && b.ze.splice(c, 1);
    ge(b, a)
}
function fe(a, b) { ! a.lt || !b || 2 > b.length || b.sort(a.EE)
};
function ie(a, b, c) {
    this.ag = a;
    this.kw = b;
    this.lw = c
};
function je() {
    this.nw = [];
    this.jw = {};
    this.Gz = "L2_Town01.PNG"
}
function ke() {
    var a = w.Bm;
    a.nw.length = 0;
    a.jw = {}
}
function le(a, b) {
    a.nw.push(b);
    a.jw[b.ag] = b;
    var c = w.S.hb(b.kw, b.lw);
    c && c.ea(w.I.v(a.Gz))
}
je.prototype.Yw = function(a) {
    var b = 1 + k(2);
    return 0.5 > Math.random() ? a - b: a + b
};
function ze(a, b, c) {
    this.ag = a;
    this.iq = b;
    this.jq = c
};
function Ae() {
    this.ht = [];
    this.zx = {};
    this.ni = 0;
    this.tB = "L2_Terrain089.PNG L2_Terrain077.PNG L2_Terrain077.PNG L2_Terrain076.PNG L2_Terrain078.PNG L2_Terrain079.PNG L2_Terrain083.PNG L2_Terrain084.PNG L2_Terrain085.PNG".split(" ")
}
function Be() {
    var a = w.ug;
    a.ht.length = 0;
    a.ni = 0;
    a.zx = {}
}
function Ce(a) {
    return a.tB[k(a.tB.length)]
}
Ae.prototype.Ut = function(a) {
    this.ht.push(a);
    this.zx[a.ag] = a;
    if (a = w.S.hb(a.iq, a.jq)) {
        var b = w.I.v(Ce(this));
        a.ea(b)
    }
};
Ae.prototype.Yw = function(a) {
    return 0.5 > Math.random() ? a - 4 : a + 4
};
var De = "O";
var Ee = {
    GOGO: "L1_ShoreEout.PNG",
    GOGG: "L1_ShoreNEin.PNG",
    OOGO: "L1_ShoreNEout.PNG",
    OOGG: "L1_ShoreNout.PNG",
    GGGO: "L1_ShoreSEin.PNG",
    GOOO: "L1_ShoreSEout.PNG",
    GGOO: "L1_ShoreSout.PNG",
    OGGG: "L1_ShoreWNin.PNG",
    OOOG: "L1_ShoreWNout.PNG",
    GOOG: "L1_ShoreWN-SE.PNG",
    OGOG: "L1_ShoreWout.PNG",
    GGOG: "L1_ShoreWSin.PNG",
    OGGO: "L1_ShoreWS-NE.PNG",
    OGOO: "L1_ShoreWSout.PNG",
    DDGG: "L1_GrassDesertEdgeE.PNG",
    DGDG: "L1_GrassDesertEdgeN.PNG",
    DDDG: "L1_GrassDesertEdgeNE.PNG",
    GGGD: "L1_GrassDesertEdgeNEin.PNG",
    DGDD: "L1_GrassDesertEdgeNW.PNG",
    GDGG: "L1_GrassDesertEdgeNWin.PNG",
    GDGD: "L1_GrassDesertEdgeS.PNG",
    DDGD: "L1_GrassDesertEdgeSE.PNG",
    GGDG: "L1_GrassDesertEdgeSEin.PNG",
    GDDD: "L1_GrassDesertEdgeSW.PNG",
    DGGG: "L1_GrassDesertEdgeSWin.PNG",
    GGDD: "L1_GrassDesertEdgeW.PNG",
    GSGG: "L1_SnowEdge01.PNG",
    GSGS: "L1_SnowEdge02.PNG",
    GGGS: "L1_SnowEdge03.PNG",
    SSGG: "L1_SnowEdge04.PNG",
    GGSS: "L1_SnowEdge05.PNG",
    SGGG: "L1_SnowEdge06.PNG",
    SGSG: "L1_SnowEdge07.PNG",
    GGSG: "L1_SnowEdge08.PNG",
    SGSS: "L1_SnowEdge09.PNG",
    SSSG: "L1_SnowEdge10.PNG",
    GSSS: "L1_SnowEdge11.PNG",
    SSGS: "L1_SnowEdge12.PNG",
    PPDD: "L1_DesertShoreE.PNG",
    PDPD: "L1_DesertShoreN.PNG",
    PPPD: "L1_DesertShoreNE.PNG",
    DDDP: "L1_DesertShoreNEin.PNG",
    PDPP: "L1_DesertShoreNW.PNG",
    DPDD: "L1_DesertShoreNWin.PNG",
    DPDP: "L1_DesertShoreS.PNG",
    PPDP: "L1_DesertShoreSE.PNG",
    DDPD: "L1_DesertShoreSEin.PNG",
    DPPP: "L1_DesertShoreSW.PNG",
    PDDD: "L1_DesertShoreSWin.PNG",
    DDPP: "L1_DesertShoreW.PNG",
    ISII: "L1_IceShore01.PNG",
    ISIS: "L1_IceShore02.PNG",
    IIIS: "L1_IceShore03.PNG",
    SSII: "L1_IceShore04.PNG",
    IISS: "L1_IceShore05.PNG",
    SIII: "L1_IceShore06.PNG",
    SISI: "L1_IceShore07.PNG",
    IISI: "L1_IceShore08.PNG",
    SISS: "L1_IceShore13.PNG",
    SSSI: "L1_IceShore14.PNG",
    ISSS: "L1_IceShore15.PNG",
    SSIS: "L1_IceShore16.PNG",
    GGGG: "L1_Terrain001.PNG",
    OOOO: "L1_Terrain005.PNG",
    DDDD: "L1_Terrain011.PNG",
    PPPP: "L1_Terrain004.PNG",
    SSSS: "L1_Terrain035.PNG",
    IIII: "L1_Terrain005.PNG",
    JD: "L1_Terrain048.PNG"
},
Fe = "L2_ForestCanopy01.PNG",
Ge = "L2_ForestCanopy03.PNG",
He = "L2_ForestMaple03.PNG",
Ie = "L2_ForestPine01.PNG",
Je = "L2_ForestPine02.PNG",
Ke = "L2_ForestPine03.PNG",
Te = "L2_ForestPine07.PNG",
Ue = "L2_ForestPine08.PNG",
Ve = "L2_ForestPine09.PNG",
We = "L2_ForestMixed05.PNG",
Xe = "L2_ForestWillow03.PNG",
Ye = "L1_Hills.PNG",
Ze = "L2_MountainBigEarth01.PNG",
$e = "L2_MountainBigRock01.PNG",
af = "L2_MountainBigVolcano01.PNG",
bf = "L2_MountainBigVolcanoActive01.PNG",
cf = "L2_MountainBigVolcanoErupt01.PNG",
df = "L2_MountainRocky01.PNG",
ef = "L2_MountainRocky02.PNG",
ff = "L2_MountainRocky03.PNG",
gf = "L2_MountainRocky04.PNG",
hf = "L2_MountainRocky05.PNG",
jf = "L2_Terrain041.PNG",
kf = "L1_Terrain033.PNG",
lf = "L2_MountainDesert01.PNG",
mf = "L2_MountainDesert02.PNG",
Ff = "L2_MountainDesert03.PNG",
Gf = "L2_MountainDesert04.PNG",
Hf = "L2_MountainDesert05.PNG",
If = "L2_MountainDesert06.PNG",
Jf = "L2_ForestPine04.PNG",
Kf = "L2_ForestPine05.PNG",
Lf = "L2_ForestPine06.PNG",
Mf = "L2_Terrain040.PNG",
Nf = "L1_Terrain039.PNG";
function Of(a, b, c, d, f) {
    var g = this.RA = new oa,
    h, l;
    h = new ga(a);
    l = [];
    for (a = 0; 256 > a; a++) l[a] = Math.floor(256 * h.random());
    g.Wj = [];
    for (a = 0; 512 > a; a++) g.Wj[a] = l[a & 255];
    this.NE = 1;
    this.QE = b;
    this.PE = c;
    this.RE = d;
    this.OE = f
}
function Pf(a, b, c) {
    var d = 0,
    f = a.NE,
    g = a.OE,
    h;
    for (h = 0; h < a.RE; h++) {
        var l = a.RA,
        n = b * g,
        p = c * g,
        s = void 0,
        u = void 0,
        y = void 0,
        A = y = void 0,
        C = void 0,
        v = void 0,
        D = s = u = y = u = void 0,
        N = u = void 0,
        I = v = y = void 0,
        x = void 0,
        N = D = x = I = C = A = void 0,
        y = 0.5 * (n + p) * (l.HB - 1),
        A = Math.floor(n + y),
        C = Math.floor(p + y),
        v = (3 - l.HB) / 6,
        u = (A + C) * v,
        y = A - u,
        u = C - u,
        s = n - y,
        D = p - u,
        p = n = void 0;
        s > D ? (n = 1, p = 0) : (n = 0, p = 1);
        u = s - n + v;
        N = D - p + v;
        y = s - 1 + 2 * v;
        v = D - 1 + 2 * v;
        I = A & 255;
        x = C & 255;
        A = l.Wj[I + l.Wj[x]] % 12;
        C = l.Wj[I + n + l.Wj[x + p]] % 12;
        I = l.Wj[I + 1 + l.Wj[x + 1]] % 12;
        x = 0.5 - s * s - D * D;
        0 > x ? s = 0 : (x *= x, s = x * x * (l.Im[A][0] * s + l.Im[A][1] * D));
        D = 0.5 - u * u - N * N;
        0 > D ? u = 0 : (D *= D, u = D * D * (l.Im[C][0] * u + l.Im[C][1] * N));
        N = 0.5 - y * y - v * v;
        0 > N ? y = 0 : (N *= N, y = N * N * (l.Im[I][0] * y + l.Im[I][1] * v));
        d += 70 * f * (s + u + y);
        f *= a.PE;
        g *= a.QE
    }
    return d
};
function Qf() {
    this.ow = new Of(5, 2, 0.5, 4, 0.003);
    this.qD = new Of(2, 2, 0.5, 2, 1E-4);
    this.Dr = []
}
function Rf(a, b) {
    a.Dr.push(b)
}
Qf.prototype.v = function(a, b) {
    var c = a * w.B,
    d = b * w.B;
    if ( - 0.3 < Pf(this.ow, c, d)) return null;
    c = (Pf(this.qD, c, d) - -0.8) / (2 / this.Dr.length) | 0;
    return c > this.Dr.length ? w.I.v("L2_Town01.PNG") : w.I.v(this.Dr[c])
};
function Sf() {
    this.ow = new Of(9, 2, 0.5, 4, 0.003);
    this.fE = new Of(7, 2, 0.9, 1, 0.02);
    this.Fs = []
}
function Tf(a, b) {
    a.Fs.push(b)
}
Sf.prototype.v = function(a, b) {
    var c = a * w.B,
    d = b * w.B;
    if ( - 0.3 < Pf(this.ow, c, d)) return null;
    c = (Pf(this.fE, c, d) - -0.8) / (0.1 / this.Fs.length) | 0;
    return c > this.Fs.length ? null: w.I.v(this.Fs[c])
};
function Uf(a, b) {
    this.pE = new Of(10, 2.012, 0.5, 5, 1E-4);
    this.ox = new Of(2, 2, 0.5, 3, 5E-4);
    this.eg = new Qf;
    Rf(this.eg, Fe);
    Rf(this.eg, Ge);
    Rf(this.eg, Ie);
    Rf(this.eg, Je);
    Rf(this.eg, Ke);
    Rf(this.eg, Te);
    Rf(this.eg, Ue);
    Rf(this.eg, Ve);
    Rf(this.eg, Xe);
    Rf(this.eg, We);
    Rf(this.eg, He);
    this.wf = new Sf;
    Tf(this.wf, Ze);
    Tf(this.wf, $e);
    Tf(this.wf, af);
    Tf(this.wf, bf);
    Tf(this.wf, cf);
    Tf(this.wf, df);
    Tf(this.wf, ef);
    Tf(this.wf, ff);
    Tf(this.wf, gf);
    Tf(this.wf, hf);
    Tf(this.wf, jf);
    Tf(this.wf, Ye);
    this.kt = new Qf;
    Rf(this.kt, Jf);
    Rf(this.kt, Kf);
    Rf(this.kt, Lf);
    this.Bx = new Sf;
    Tf(this.Bx, Nf);
    Tf(this.Bx, Mf);
    this.tj = new Sf;
    Tf(this.tj, lf);
    Tf(this.tj, mf);
    Tf(this.tj, kf);
    Tf(this.tj, Ff);
    Tf(this.tj, Gf);
    Tf(this.tj, Hf);
    Tf(this.tj, If);
    this.rc = a;
    this.sc = b;
    this.tE = this.ZD = "L1_Terrain015.PNG"
}
function Vf(a, b) {
    var c = dd(b.Hd + "_" + b.Id),
    d,
    f,
    g = b.Hd * a.rc,
    h = b.Id * a.sc;
    for (f = 0; f <= a.rc; f++) for (d = 0; d <= a.sc; d++) {
        var l = b,
        n = f,
        p = d,
        s = Wf(a, g + f, h + d, c),
        u = void 0;
        if (u = Xf(l, n - 1, p - 1)) u.xB = s;
        if (u = Xf(l, n, p - 1)) u.yB = s;
        if (u = Xf(l, n - 1, p)) u.KA = s;
        if (u = Xf(l, n, p)) u.LA = s
    }
    for (f = 0; f < a.rc; f++) for (d = 0; d < a.sc; d++) g = Xf(b, f, d),
    h = void 0,
    !c || c.$b ? (h = a.ZD, g.Kn = null, g.Ln = 1E5) : (l = g.LA + g.KA + g.yB + g.xB, h = Ee[l], g.Kn = l, h || (console.log("no sprite found for key: [" + l + "]"), h = Ee.JD), g.Ln = "PPPP" === g.Kn || "OOOO" === g.Kn || "IIII" === g.Kn ? 1E5: 0),
    (h = w.I.v(h)) && g.Qa(h);
    g = b.Hd * a.rc;
    h = b.Id * a.sc;
    if (!c || c.$b) for (f = 0; f < a.rc; f++) for (d = 0; d < a.sc; d++) n = Xf(b, f, d),
    n.ea(null),
    n.Ln = 1E5;
    else for (f = 0; f < a.rc; f++) for (d = 0; d < a.sc; d++) n = Xf(b, f, d),
    (l = n.Kn) ? (s = null, p = 0, "GGGG" === l ? (s = a.eg.v(g + f, h + d)) ? p = 10 : (s = a.wf.v(g + f, h + d)) && (p = 1E4) : "DDDD" === l ? (s = a.tj.v(g + f, h + d)) && (p = 1E4) : "SSSS" === l && ((s = a.kt.v(g + f, h + d)) ? p = 10 : (s = a.Bx.v(g + f, h + d)) && (p = 1E4)), s ? (n.Ln += p, n.ea(s)) : n.ea(null)) : n.ea(null);
    c && !c.$b && ((d = (d = w.Aa.Do[b.Hd + "_" + b.Id]) ? d: null) ? (f = d.bc(), g = d.cc(), (h = w.S.hb(f, g)) ? h.ea(w.I.v(d.Fo)) : (console.log("no tile for: col=" + f + " row=" + g), d = null)) : d = null, d && ((f = w.Bm.jw[d.ag]) && (f = w.S.hb(f.kw, f.lw)) && f.ea(w.I.v(w.Bm.Gz)), a.Ut(d)), f = fd(b.Hd + "_" + b.Id)) && (d = f.dm, f = f.em, (g = w.S.hb(d, f)) ? g.ea(w.I.v(w.kb.Ny)) : console.log("no tile for: col=" + d + " row=" + f));
    f = w.I.v(a.tE);
    g = dd(b.Hd + "_" + (b.Id - 1));
    h = dd(b.Hd - 1 + "_" + b.Id);
    l = dd(b.Hd - 1 + "_" + (b.Id - 1));
    if (c != g) for (n = 0; n < a.rc; n++) d = Xf(b, n, 0),
    d.Qa(f),
    d.ea(null);
    if (c != h) for (n = 0; n < a.sc; n++) d = Xf(b, 0, n),
    d.Qa(f),
    d.ea(null);
    c === g && c === h && c != l && (d = Xf(b, 0, 0), d.Qa(f), d.ea(null))
}
Uf.prototype.Ut = function(a) {
    var b;
    if (b = w.ug.zx[a.ag]) {
        if (a = w.S.hb(b.iq, b.jq)) b = w.I.v(Ce(w.ug)),
        a.ea(b)
    } else {
        b = w.ug;
        for (var c = a.vw(), d = a.ww(), f = a.bc(), g = a.cc(), h = 1 + c * xc + k(xc - 1), l = 1 + d * yc + k(yc - 1); h === f && l === g;) h = 1 + c * xc + k(xc - 1),
        l = 1 + d * yc + k(yc - 1);
        b.Ut(new ze(a.ag, h, l))
    }
};
function Wf(a, b, c, d) {
    b *= w.B;
    c *= w.B;
    var f = Pf(a.pE, b, c);
    return ! d || d.$b ? 0.5 > f && (a = Pf(a.ox, b, c), -0.6 > a) ? "P": "D": d.cb ? 0.5 > f && (a = Pf(a.ox, b, c), -0.6 > a) ? De: "G": 0.5 > f && (a = Pf(a.ox, b, c), -0.6 > a) ? "I": "S"
};
function Yf(a, b) {
    this.Qn = a;
    this.Tn = b;
    this.NC = a * w.B;
    this.OC = b * w.B;
    this.Yf = this.Jn = null;
    this.Kn = "GGGG";
    this.xB = this.KA = this.yB = this.LA = De;
    this.Ln = this.ln = 0
}
e = Yf.prototype;
e.dc = function() {
    return this.NC
};
e.ec = function() {
    return this.OC
};
e.bc = function() {
    return this.Qn
};
e.cc = function() {
    return this.Tn
};
e.Qa = function(a) {
    this.Jn = a
};
e.ea = function(a) {
    this.Yf = a
};
function Zf(a, b, c) {
    this.jo = [];
    this.Hd = a;
    this.Id = b;
    this.sc = yc;
    this.rc = xc;
    this.Qj = a * this.rc;
    this.Rj = b * this.sc;
    this.wp = this.Qj + this.rc;
    this.xp = this.Rj + this.sc;
    this.yp = this.Qj * w.B;
    this.Mw = this.wp * w.B;
    this.zp = this.Rj * w.B;
    this.Nw = this.xp * w.B;
    this.wt = c;
    this.Aw()
}
function B(a, b, c, d) {
    a.Hd = b;
    a.Id = c;
    a.Qj = b * a.rc;
    a.Rj = c * a.sc;
    a.wp = a.Qj + a.rc;
    a.xp = a.Rj + a.sc;
    a.yp = a.Qj * w.B;
    a.Mw = a.wp * w.B;
    a.zp = a.Rj * w.B;
    a.Nw = a.xp * w.B;
    if (d) {
        for (c = 0; c < a.rc; c++) for (d = a.jo[c], b = 0; b < a.sc; b++) {
            var f = d[b],
            g = a.Qj + c,
            h = a.Rj + b;
            f.Qn = g;
            f.Tn = h;
            f.NC = g * w.B;
            f.OC = h * w.B
        }
        Vf(a.wt, a)
    }
}
function $f(a, b, c) {
    return b >= a.yp && b < a.Mw && c >= a.zp && c < a.Nw
}
Zf.prototype.Aw = function() {
    var a, b, c, d = this.Hd * this.rc,
    f = this.Id * this.sc;
    for (b = 0; b < this.rc; b++) {
        c = [];
        for (a = 0; a < this.sc; a++) c.push(new Yf(d + b, f + a));
        this.jo.push(c)
    }
};
function Xf(a, b, c) {
    return 0 > b || b >= a.rc || 0 > c || c >= a.sc ? null: a.jo[b][c]
};
function ag() {
    this.wt = new Uf(xc, yc);
    this.ie = this.he = 0;
    this.R = zc;
    this.L = Ac;
    this.q = [];
    this.ty = !1
}
function bg(a) {
    var b = [],
    c,
    d,
    f;
    for (d = 0; 3 > d; d++) {
        c = [];
        for (f = 0; 3 > f; f++) c.push(new Zf(d + a.R, f + a.L, a.wt));
        b.push(c)
    }
    return b
}
function cg() {
    var a = w.S;
    a.q = bg(a);
    ed(a);
    a.he = a.q[1][1].yp + xc * w.B / 2 | 0;
    a.ie = a.q[1][1].zp + yc * w.B / 2 | 0;
    var b;
    for (b = 0; b < w.i.D.length; b++) {
        var c = a.he + k(30),
        d = a.ie + k(30);
        t(w.i.D[b].p.Db, c, d)
    }
    a.ty = !0
}
function ed(a) {
    var b, c;
    for (c = 0; 3 > c; c++) for (b = 0; 3 > b; b++) {
        var d = a.q[c][b];
        Vf(d.wt, d)
    }
}
e = ag.prototype;
e.hb = function(a, b) {
    var c = (a / xc | 0) - this.R,
    d = (b / yc | 0) - this.L;
    if (0 > c || 3 <= c || 0 > d || 3 <= d) return null;
    c = this.q[c][d];
    return Xf(c, a - (c.yp / w.B | 0), b - (c.zp / w.B | 0))
};
e.bc = function(a) {
    return a / w.B | 0
};
e.cc = function(a) {
    return a / w.B | 0
};
e.vw = function(a) {
    return this.bc(a) / xc | 0
};
e.ww = function(a) {
    return this.cc(a) / yc | 0
};
e.dc = function(a) {
    return a * w.B | 0
};
e.ec = function(a) {
    return a * w.B | 0
};
function dg(a) {
    var b = w.S,
    c, d, f, g = 1E9,
    h = -1;
    for (c = 0; c < b.q.length; c++) d = b.q[c][0],
    d = a < d.Qj ? d.Qj: a >= d.wp ? d.wp - 1 : a,
    f = Math.abs(a - d),
    f < g && (h = d, g = f);
    return h
}
function pg(a) {
    var b, c, d, f = w.S.q[0],
    g = 1E8,
    h = -1;
    for (b = 0; b < f.length; b++) c = f[b],
    c = a < c.Rj ? c.Rj: a >= c.xp ? c.xp - 1 : a,
    d = Math.abs(a - c),
    d < g && (g = d, h = c);
    return h
};
var sd = {
    floor: "L1_Terrain014.PNG",
    Za: {
        di: "L2_Door007.PNG",
        ci: "L2_Door008.PNG",
        Lh: "L2_StairsDownNS.PNG",
        Kh: "L2_StairsDownEW.PNG"
    },
    Ac: {
        kg: "L2_Door001.PNG",
        jg: "L2_Door002.PNG",
        Vf: "L2_Door003.PNG",
        Uf: "L2_Door004.PNG"
    },
    Kb: {
        Cg: "L2_WallBrickNS.PNG",
        Eg: "L2_WallBrickEW.PNG",
        Fg: "L2_WallBrickNE.PNG",
        Dg: "L2_WallBrickES.PNG",
        Hg: "L2_WallBrickNW.PNG",
        Gg: "L2_WallBrickSW.PNG",
        ii: "L2_WallBrickNESW.PNG",
        Ah: "L2_WallBrickESW.PNG",
        Bh: "L2_WallBrickNEW.PNG",
        zh: "L2_WallBrickNES.PNG",
        Ch: "L2_WallBrickNSW.PNG",
        Xc: "L2_WallBrickW.PNG",
        E: "L2_WallBrickN.PNG",
        ji: "L2_WallBrickE.PNG",
        ki: "L2_WallBrickS.PNG"
    },
    Th: [{
        Oo: [],
        JC: ["L3_WallDeco23.PNG", "L3_WallDeco49.PNG"],
        KC: ["L3_WallDeco24.PNG", "L3_WallDeco50.PNG"]
    }]
},
Cd = {
    floor: "L1_Terrain015.PNG",
    Za: {
        di: "L2_DarkStoneStairsUpNS.PNG",
        ci: "L2_DarkStoneStairsUpEW.PNG",
        Lh: "L2_DarkStoneStairsDownNS.PNG",
        Kh: "L2_DarkStoneStairsDownEW.PNG"
    },
    Ac: {
        kg: "L2_Door001.PNG",
        jg: "L2_Door002.PNG",
        Vf: "L2_Door003.PNG",
        Uf: "L2_Door004.PNG"
    },
    Kb: {
        Cg: "L2_WallDarkBrickNS.PNG",
        Eg: "L2_WallDarkBrickEW.PNG",
        Fg: "L2_WallDarkBrickNE.PNG",
        Dg: "L2_WallDarkBrickES.PNG",
        Hg: "L2_WallDarkBrickNW.PNG",
        Gg: "L2_WallDarkBrickSW.PNG",
        ii: "L2_WallDarkBrickNESW.PNG",
        Ah: "L2_WallDarkBrickESW.PNG",
        Bh: "L2_WallDarkBrickNEW.PNG",
        zh: "L2_WallDarkBrickNES.PNG",
        Ch: "L2_WallDarkBrickNSW.PNG",
        Xc: "L2_WallDarkBrickW.PNG",
        E: "L2_WallDarkBrickN.PNG",
        ji: "L2_WallDarkBrickE.PNG",
        ki: "L2_WallDarkBrickS.PNG"
    },
    Th: []
},
qd = {
    floor: "L1_Terrain013.PNG",
    Za: {
        di: "L2_StairsHutUpNS.PNG",
        ci: "L2_StairsHutUpEW.PNG",
        Lh: "L2_StairsHutDownNS.PNG",
        Kh: "L2_StairsHutDownEW.PNG"
    },
    Ac: {
        kg: "L2_Door001.PNG",
        jg: "L2_Door002.PNG",
        Vf: "L2_Door003.PNG",
        Uf: "L2_Door004.PNG"
    },
    Kb: {
        Cg: "L2_WallCaveNS.PNG",
        Eg: "L2_WallCaveEW.PNG",
        Fg: "L2_WallCaveNE.PNG",
        Dg: "L2_WallCaveES.PNG",
        Hg: "L2_WallCaveNW.PNG",
        Gg: "L2_WallCaveSW.PNG",
        ii: "L2_WallCaveNESW.PNG",
        Ah: "L2_WallCaveESW.PNG",
        Bh: "L2_WallCaveNEW.PNG",
        zh: "L2_WallCaveNES.PNG",
        Ch: "L2_WallCaveNSW.PNG",
        Xc: "L2_WallCaveW.PNG",
        E: "L2_WallCaveN.PNG",
        ji: "L2_WallCaveE.PNG",
        ki: "L2_WallCaveS.PNG"
    },
    Th: []
},
Ed = {
    floor: "L1_FloorPattern.PNG",
    Za: {
        di: "L2_StairsBoneUpNS.PNG",
        ci: "L2_StairsBoneUpEW.PNG",
        Lh: "L2_StairsBoneDownNS.PNG",
        Kh: "L2_StairsBoneDownEW.PNG"
    },
    Ac: {
        kg: "L2_DoorBoneOpenNS.PNG",
        jg: "L2_DoorBoneOpenEW.PNG",
        Vf: "L2_DoorBoneClosedNS.PNG",
        Uf: "L2_DoorBoneClosedEW.PNG"
    },
    Kb: {
        Cg: "L2_WallBoneNS.PNG",
        Eg: "L2_WallBoneEW.PNG",
        Fg: "L2_WallBoneNE.PNG",
        Dg: "L2_WallBoneES.PNG",
        Hg: "L2_WallBoneNW.PNG",
        Gg: "L2_WallBoneSW.PNG",
        ii: "L2_WallBoneNESW.PNG",
        Ah: "L2_WallBoneESW.PNG",
        Bh: "L2_WallBoneNEW.PNG",
        zh: "L2_WallBoneNES.PNG",
        Ch: "L2_WallBoneNSW.PNG",
        Xc: "L2_WallBoneW.PNG",
        E: "L2_WallBoneN.PNG",
        ji: "L2_WallBoneE.PNG",
        ki: "L2_WallBoneS.PNG"
    },
    Th: []
},
Dd = {
    floor: "L1_Terrain049.PNG",
    Za: {
        di: "L2_DarkStoneStairsUpNS.PNG",
        ci: "L2_DarkStoneStairsUpEW.PNG",
        Lh: "L2_DarkStoneStairsDownNS.PNG",
        Kh: "L2_DarkStoneStairsDownEW.PNG"
    },
    Ac: {
        kg: "L2_DoorDarkStoneOpenNS.PNG",
        jg: "L2_DoorDarkStoneOpenEW.PNG",
        Vf: "L2_DoorDarkStoneClosedNS.PNG",
        Uf: "L2_DoorDarkStoneClosedEW.PNG"
    },
    Kb: {
        Cg: "L2_WallDarkStoneNS.PNG",
        Eg: "L2_WallDarkStoneEW.PNG",
        Fg: "L2_WallDarkStoneNE.PNG",
        Dg: "L2_WallDarkStoneES.PNG",
        Hg: "L2_WallDarkStoneNW.PNG",
        Gg: "L2_WallDarkStoneSW.PNG",
        ii: "L2_WallDarkStoneNESW.PNG",
        Ah: "L2_WallDarkStoneESW.PNG",
        Bh: "L2_WallDarkStoneNEW.PNG",
        zh: "L2_WallDarkStoneNES.PNG",
        Ch: "L2_WallDarkStoneNSW.PNG",
        Xc: "L2_WallDarkStoneW.PNG",
        E: "L2_WallDarkStoneN.PNG",
        ji: "L2_WallDarkStoneE.PNG",
        ki: "L2_WallDarkStoneS.PNG"
    },
    Th: []
},
rd = {
    floor: "L1_Terrain004.PNG",
    Za: {
        di: "L2_StairsIceUpNS.PNG",
        ci: "L2_StairsIceUpEW.PNG",
        Lh: "L2_StairsIceDownNS.PNG",
        Kh: "L2_StairsIceDownEW.PNG"
    },
    Ac: {
        kg: "L2_DoorIceOpenNS.PNG",
        jg: "L2_DoorIceOpenEW.PNG",
        Vf: "L2_DoorIceClosedNS.PNG",
        Uf: "L2_DoorIceClosedEW.PNG"
    },
    Kb: {
        Cg: "L2_WallIceNS.PNG",
        Eg: "L2_WallIceEW.PNG",
        Fg: "L2_WallIceNE.PNG",
        Dg: "L2_WallIceES.PNG",
        Hg: "L2_WallIceNW.PNG",
        Gg: "L2_WallIceSW.PNG",
        ii: "L2_WallIceNESW.PNG",
        Ah: "L2_WallIceESW.PNG",
        Bh: "L2_WallIceNEW.PNG",
        zh: "L2_WallIceNES.PNG",
        Ch: "L2_WallIceNSW.PNG",
        Xc: "L2_WallIceW.PNG",
        E: "L2_WallIceN.PNG",
        ji: "L2_WallIceE.PNG",
        ki: "L2_WallIceS.PNG"
    },
    Th: [{
        Oo: ["L2_IceFloorDeco1.PNG", "L2_IceFloorDeco3.PNG", "L2_IceFloorDeco2.PNG"],
        JC: [],
        KC: []
    }]
},
ud = {
    floor: "L1_Terrain049.PNG",
    Za: {
        di: "L2_StairsIronUpNS.PNG",
        ci: "L2_StairsIronUpEW.PNG",
        Lh: "L2_StairsIronDownNS.PNG",
        Kh: "L2_StairsIronDownEW.PNG"
    },
    Ac: {
        kg: "L2_DoorIronOpenNS.PNG",
        jg: "L2_DoorIronOpenEW.PNG",
        Vf: "L2_DoorIronClosedNS.PNG",
        Uf: "L2_DoorIronClosedEW.PNG"
    },
    Kb: {
        Cg: "L2_WallIronNS.PNG",
        Eg: "L2_WallIronEW.PNG",
        Fg: "L2_WallIronNE.PNG",
        Dg: "L2_WallIronES.PNG",
        Hg: "L2_WallIronNW.PNG",
        Gg: "L2_WallIronSW.PNG",
        ii: "L2_WallIronNESW.PNG",
        Ah: "L2_WallIronESW.PNG",
        Bh: "L2_WallIronNEW.PNG",
        zh: "L2_WallIronNES.PNG",
        Ch: "L2_WallIronNSW.PNG",
        Xc: "L2_WallIronW.PNG",
        E: "L2_WallIronN.PNG",
        ji: "L2_WallIronE.PNG",
        ki: "L2_WallIronS.PNG"
    },
    Th: []
},
pd = {
    floor: "L1_Terrain049.PNG",
    Za: {
        di: "L2_DarkStoneStairsUpNS.PNG",
        ci: "L2_DarkStoneStairsUpEW.PNG",
        Lh: "L2_DarkStoneStairsDownNS.PNG",
        Kh: "L2_DarkStoneStairsDownEW.PNG"
    },
    Ac: {
        kg: "L2_DoorDarkStoneOpenNS.PNG",
        jg: "L2_DoorDarkStoneOpenEW.PNG",
        Vf: "L2_DoorDarkStoneClosedNS.PNG",
        Uf: "L2_DoorDarkStoneClosedEW.PNG"
    },
    Kb: {
        Cg: "L2_WallMineNS.PNG",
        Eg: "L2_WallMineEW.PNG",
        Fg: "L2_WallMineNE.PNG",
        Dg: "L2_WallMineES.PNG",
        Hg: "L2_WallMineNW.PNG",
        Gg: "L2_WallMineSW.PNG",
        ii: "L2_WallMineNESW.PNG",
        Ah: "L2_WallMineESW.PNG",
        Bh: "L2_WallMineNEW.PNG",
        zh: "L2_WallMineNES.PNG",
        Ch: "L2_WallMineNSW.PNG",
        Xc: "L2_WallMineW.PNG",
        E: "L2_WallMineN.PNG",
        ji: "L2_WallMineE.PNG",
        ki: "L2_WallMineS.PNG"
    },
    Th: []
},
Bd = {
    floor: "L1_Terrain010.PNG",
    Za: {
        di: "L2_StairsUpNS.PNG",
        ci: "L2_StairsUpEW.PNG",
        Lh: "L2_StairsDownNS.PNG",
        Kh: "L2_StairsDownEW.PNG"
    },
    Ac: {
        kg: "L2_DoorOpenNS.PNG",
        jg: "L2_DoorOpenEW.PNG",
        Vf: "L2_DoorClosedNS.PNG",
        Uf: "L2_DoorClosedEW.PNG"
    },
    Kb: {
        Cg: "L2_WallStoneNS.PNG",
        Eg: "L2_WallStoneEW.PNG",
        Fg: "L2_WallStoneNE.PNG",
        Dg: "L2_WallStoneES.PNG",
        Hg: "L2_WallStoneNW.PNG",
        Gg: "L2_WallStoneSW.PNG",
        ii: "L2_WallStoneNESW.PNG",
        Ah: "L2_WallStoneESW.PNG",
        Bh: "L2_WallStoneNEW.PNG",
        zh: "L2_WallStoneNES.PNG",
        Ch: "L2_WallStoneNSW.PNG",
        Xc: "L2_WallStoneW.PNG",
        E: "L2_WallStoneN.PNG",
        ji: "L2_WallStoneE.PNG",
        ki: "L2_WallStoneS.PNG"
    },
    Th: []
},
td = {
    floor: "L1_Terrain011.PNG",
    Za: {
        di: "L2_StairsHutUpNS.PNG",
        ci: "L2_StairsHutUpEW.PNG",
        Lh: "L2_StairsHutDownNS.PNG",
        Kh: "L2_StairsHutDownEW.PNG"
    },
    Ac: {
        kg: "L2_DoorHutOpenNS.PNG",
        jg: "L2_DoorHutOpenEW.PNG",
        Vf: "L2_DoorHutClosedNS.PNG",
        Uf: "L2_DoorHutClosedEW.PNG"
    },
    Kb: {
        Cg: "L2_WallWoodNS.PNG",
        Eg: "L2_WallWoodEW.PNG",
        Fg: "L2_WallWoodNE.PNG",
        Dg: "L2_WallWoodES.PNG",
        Hg: "L2_WallWoodNW.PNG",
        Gg: "L2_WallWoodSW.PNG",
        ii: "L2_WallWoodNESW.PNG",
        Ah: "L2_WallWoodESW.PNG",
        Bh: "L2_WallWoodNEW.PNG",
        zh: "L2_WallWoodNES.PNG",
        Ch: "L2_WallWoodNSW.PNG",
        Xc: "L2_WallWoodW.PNG",
        E: "L2_WallWoodN.PNG",
        ji: "L2_WallWoodE.PNG",
        ki: "L2_WallWoodS.PNG"
    },
    Th: []
};
function qg(a, b, c, d) {
    this.TD = a;
    this.UD = b;
    this.VD = c;
    this.WD = d;
    this.bt = this.Yf = this.Jn = null;
    this.Rb = rg;
    this.Pq = null;
    this.li = 0
}
e = qg.prototype;
e.Ai = function() {
    return this.TD
};
e.Bi = function() {
    return this.UD
};
e.Ob = function() {
    return this.VD
};
e.Pb = function() {
    return this.WD
};
e.Qa = function(a) {
    this.Jn = a
};
e.ea = function(a) {
    this.Yf = a
};
function sg(a, b) {
    a.Pq = b;
    a.li = b ? k(b.li) : 0
}
e.qB = function(a) {
    this.li = a
};
var rg = 0;
function tg(a, b, c, d, f) {
    this.fk = 0;
    this.ia = a;
    this.ja = b;
    this.rb = c;
    this.qb = d;
    this.Yp = f;
    this.ro = [];
    this.Nc = [];
    this.G = this.Ga = this.Za = null;
    this.Xi = !1
}
e = tg.prototype;
e.xx = function(a, b) {
    this.Ga = a;
    this.G = b
};
function ug(a) {
    return a.ia * w.B
}
function vg(a) {
    return a.ia * w.B + a.rb * w.B
}
function wg(a) {
    return a.ja * w.B
}
function xg(a) {
    return a.ja * w.B + a.qb * w.B
}
e.yx = function() {
    1 < this.ia && this.ia--;
    1 < this.ja && this.ja--
};
e.shiftLeft = function() {
    1 < this.ia && this.ia--
};
e.gt = function() {
    1 < this.ja && this.ja--
};
e.Bq = function(a) {
    this.Lw(a);
    var b, c;
    c = this.ja - 1;
    for (b = this.ia - 1; b < this.ia + this.rb + 1; b++) a[b][c].Rb = 2;
    c = this.ja + this.qb;
    for (b = this.ia - 1; b < this.ia + this.rb + 1; b++) a[b][c].Rb = 2;
    b = this.ia - 1;
    b = a[b];
    for (c = this.ja - 1; c < this.ja + this.qb + 1; c++) b[c].Rb = 2;
    b = this.ia + this.rb;
    b = a[b];
    for (c = this.ja - 1; c < this.ja + this.qb + 1; c++) b[c].Rb = 2
};
e.Lw = function(a) {
    var b, c, d = this.ia + this.rb,
    f = this.ja + this.qb,
    g;
    for (c = this.ia; c < d; c++) for (b = a[c], g = this.ja; g < f; g++) b[g].Rb = 1
};
e.Ud = function(a) {
    var b = a.ia + a.rb / 2 - (this.ia + this.rb / 2);
    a = a.ja + a.qb / 2 - (this.ja + this.qb / 2);
    return b * b + a * a
};
function yg(a, b, c) {
    return b >= a.ia && b < a.ia + a.rb && c >= a.ja && c < a.ja + a.qb
}
function zg(a, b, c) {
    return c === a.ja - 1 || c === a.ja + a.qb ? b >= a.ia - 1 && b <= a.ia + a.rb: b === a.ia - 1 || b === a.ia + a.rb ? c >= a.ja - 1 && c <= a.ja + a.qb: !1
}
function Ag(a) {
    var b = !a.Xi;
    a.Xi = !0;
    if (b) {
        0 === a.Yp && Bg.t && 0.25 > Math.random() && (a.Yp = 3);
        var c = a.ia,
        d = c + a.rb,
        f = a.ja,
        g = f + a.qb,
        b = a.Nc,
        h, l, n, p = w.I.v(a.Ga.floor);
        n = w.I.v(a.Ga.Kb.Cg);
        var s = w.I.v(a.Ga.Kb.Eg);
        h = a.G[c - 1][f - 1];
        h.Qa(p);
        h.ea(w.I.v(a.Ga.Kb.Gg));
        h = a.G[d][f - 1];
        h.Qa(p);
        h.ea(w.I.v(a.Ga.Kb.Hg));
        h = a.G[c - 1][g];
        h.Qa(p);
        h.ea(w.I.v(a.Ga.Kb.Dg));
        h = a.G[d][g];
        h.Qa(p);
        h.ea(w.I.v(a.Ga.Kb.Fg));
        for (l = c; l < d; l++) h = a.G[l][f - 1],
        h.Qa(p),
        h.Yf || h.ea(n);
        for (l = c; l < d; l++) h = a.G[l][g],
        h.Qa(p),
        h.Yf || h.ea(n);
        for (n = f; n < g; n++) h = a.G[c - 1][n],
        h.Qa(p),
        h.Yf || h.ea(s);
        for (n = f; n < g; n++) h = a.G[d][n],
        h.Qa(p),
        h.Yf || h.ea(s);
        for (l = c; l < d; l++) for (c = a.G[l], n = f; n < g; n++) h = c[n],
        h.Qa(p);
        for (d = 0; d < b.length; d++) f = b[d],
        h = a.G[f.wj][f.xj],
        h.Qa(p),
        f.Ho ? f.Mb ? h.ea(w.I.v(a.Ga.Ac.kg)) : h.ea(w.I.v(a.Ga.Ac.Vf)) : f.Mb ? h.ea(w.I.v(a.Ga.Ac.jg)) : h.ea(w.I.v(a.Ga.Ac.Uf));
        a.Za && (h = a.G[a.Za.Ex][a.Za.Fx], h.Qa(p), a.Za.Fq ? a.Za.sq ? h.ea(w.I.v(a.Ga.Za.Lh)) : h.ea(w.I.v(a.Ga.Za.di)) : a.Za.sq ? h.ea(w.I.v(a.Ga.Za.Kh)) : h.ea(w.I.v(a.Ga.Za.ci)));
        p = a.Ga.Th;
        h = a.G;
        b = w.yE; ! p || 0 === p.length || 0.2 > b.wa.random() || !(p = 1 === p.length ? p[0] : ma(b.wa, p.length)) || (p.Oo && 0 < p.Oo.length && ((g = a.ia, d = a.ja, f = d + a.qb - 1, g = g + 1 + ma(b.wa, g + a.rb - 1 - g - 2), d = d + 1 + ma(b.wa, f - d - 2), t(b.yh, g, d), f = b.yh, d = h[f.T][f.U], d) ? d.Yf || ((f = p.Oo[ma(b.wa, p.Oo.length)]) ? d.ea(w.I.v(f)) : console.log("failed to select floor sprite.")) : console.log("invalid level tile. col=" + f.T + " row=" + f.U)), 0.5 > b.wa.random() ? (d = b.Xw(a), p = p.JC) : (d = b.Zw(a), p = p.KC), d && p && 0 !== p.length && Cg(a, d) && ((h = h[d.T][d.U], h) ? h.bt || ((b = p[ma(b.wa, p.length)]) ? h.bt = w.I.v(b) : console.log("failed to select wall sprite.")) : console.log("invalid level tile. col=" + d.T + " row=" + d.U)));
        if (3 === a.Yp) for (d = a.ia + 1, b = d + a.rb, h = a.ja + 1, p = h + a.qb, l = d; l < b; l++) for (g = a.G[l], c = h; c < p; c++) 0.8 > Math.random() && (d = 2 * Dg(), 0 < d && (f = g[c], w.ff.pe.push(new Eg(d, f.Ob(), f.Pb(), a))))
    }
}
function Fg(a, b, c) {
    if (b) {
        var d = b.T,
        f = b.U,
        g = (a.ia - 1) * w.B + c,
        h = vg(a) - c,
        l = (a.ja - 1) * w.B + c;
        a = xg(a) - c;
        d < g ? d = g: d > h && (d = h);
        f < l ? f = l: f > a && (f = a);
        t(b, d, f)
    }
}
function Gg(a, b) {
    if (!a.Nc) return ! 1;
    var c;
    for (c = 0; c < a.Nc.length; c++) if (Jb(b, a.Nc[c].me, a.Nc[c].ne) < w.B) return ! 0;
    return ! 1
}
function Cg(a, b) {
    var c = b.T,
    d = b.U,
    f;
    for (f = 0; f < a.Nc.length; f++) if (c === a.Nc[f].wj && d === a.Nc[f].xj) return ! 1;
    return a.Za && c === a.Za.Ex && d === a.Za.Fx ? !1 : !0
};
function Hg(a) {
    this.ne = this.me = this.xj = this.wj = 0;
    this.Mb = !1;
    this.Ho = !0;
    this.$d = a;
    this.Yk = null
};
function Ig(a) {
    this.$d = a;
    this.uq = this.tq = this.Fx = this.Ex = 0;
    this.sq = this.Fq = !0
}
function Jg(a, b, c) {
    a.Ex = b;
    a.Fx = c;
    a.tq = b * w.B;
    a.uq = c * w.B
};
function Kg(a, b, c, d) {
    this.Or = 0;
    this.Bl = a;
    this.af = b;
    this.Cl = c;
    this.Be = d;
    this.Sk = [];
    this.G = this.Ga = null;
    this.Km = !1
}
Kg.prototype.xx = function(a, b) {
    this.Ga = a;
    this.G = b
};
function Lg(a, b) {
    if (b === a.af) return a.Be;
    if (b === a.Be) return a.af;
    console.log("failed to find opposite door in hallway");
    return null
}
Kg.prototype.Bq = function(a) {
    var b, c;
    for (c = 0; c < this.Sk.length; c++) {
        b = this.Sk[c];
        var d = b.T;
        b = b.U;
        var f = a[d - 1],
        g = a[d],
        d = a[d + 1];
        f[b - 1].Rb = 2;
        f[b].Rb = 2;
        f[b + 1].Rb = 2;
        g[b - 1].Rb = 2;
        g[b].Rb = 2;
        g[b + 1].Rb = 2;
        d[b - 1].Rb = 2;
        d[b].Rb = 2;
        d[b + 1].Rb = 2
    }
    this.Lw(a)
};
Kg.prototype.Lw = function(a) {
    var b, c;
    for (c = 0; c < this.Sk.length; c++) b = this.Sk[c],
    a[b.T][b.U].Rb = 1;
    a[this.af.wj][this.af.xj].Rb = 3;
    a[this.Be.wj][this.Be.xj].Rb = 3
};
function Mg(a, b) {
    var c = b && !a.Km;
    a.Km = b;
    if (c) {
        var c = a.Sk,
        d, f, g, h = w.I.v(a.Ga.floor),
        l = w.I.v(a.Ga.Kb.Cg),
        n = w.I.v(a.Ga.Kb.Eg),
        p = w.I.v(a.Ga.Kb.Hg),
        s = w.I.v(a.Ga.Kb.Gg),
        u = w.I.v(a.Ga.Kb.Fg),
        y = w.I.v(a.Ga.Kb.Dg),
        A = w.I.v(a.Ga.Kb.Bh),
        C = w.I.v(a.Ga.Kb.Ah),
        v = w.I.v(a.Ga.Kb.zh),
        D = w.I.v(a.Ga.Kb.Ch);
        for (g = 0; g < c.length; g++) d = c[g],
        f = a.G[d.T][d.U],
        f.Qa(h);
        var N = null,
        I = null,
        x, z, O, J, la, Q, V, na, K;
        for (g = 0; g < c.length; g++) d = c[g],
        I = g + 1 < c.length ? c[g + 1] : null,
        x = d.T,
        z = d.U,
        N || (f = a.G[x][z], f.Qa(h), a.af.Ho ? a.af.Mb ? f.ea(w.I.v(a.Ga.Ac.kg)) : f.ea(w.I.v(a.Ga.Ac.Vf)) : a.af.Mb ? f.ea(w.I.v(a.Ga.Ac.jg)) : f.ea(w.I.v(a.Ga.Ac.Uf)), Q = z > I.U, V = z < I.U, K = x > I.T, na = x < I.T, K ? (f = a.G[x][z - 1], f.Qa(h), f.ea(A), f = a.G[x][z + 1], f.Qa(h), f.ea(A)) : na ? (f = a.G[x][z - 1], f.Qa(h), f.ea(C), f = a.G[x][z + 1], f.Qa(h), f.ea(C)) : Q ? (f = a.G[x + 1][z], f.Qa(h), f.ea(v), f = a.G[x - 1][z], f.Qa(h), f.ea(v)) : V && (f = a.G[x + 1][z], f.Qa(h), f.ea(D), f = a.G[x - 1][z], f.Qa(h), f.ea(D))),
        I || (f = a.G[x][z], f.Qa(h), a.Be.Ho ? a.Be.Mb ? f.ea(w.I.v(a.Ga.Ac.kg)) : f.ea(w.I.v(a.Ga.Ac.Vf)) : a.Be.Mb ? f.ea(w.I.v(a.Ga.Ac.jg)) : f.ea(w.I.v(a.Ga.Ac.Uf)), f = z < N.U, O = z > N.U, la = x < N.T, (J = x > N.T) ? (f = a.G[x][z - 1], f.Qa(h), f.ea(A), f = a.G[x][z + 1], f.Qa(h), f.ea(A)) : la ? (f = a.G[x][z - 1], f.Qa(h), f.ea(C), f = a.G[x][z + 1], f.Qa(h), f.ea(C)) : O ? (f = a.G[x + 1][z], f.Qa(h), f.ea(v), f = a.G[x - 1][z], f.Qa(h), f.ea(v)) : f && (f = a.G[x + 1][z], f.Qa(h), f.ea(D), f = a.G[x - 1][z], f.Qa(h), f.ea(D))),
        N && I && (f = z < N.U, O = z > N.U, la = x < N.T, J = x > N.T, Q = z > I.U, V = z < I.U, K = x > I.T, na = x < I.T, f && K ? (Ng(a.G[x + 1][z], h, n, !1), Ng(a.G[x + 1][z - 1], h, p, !0), Ng(a.G[x][z - 1], h, l, !1), Ng(a.G[x - 1][z + 1], h, p, !0)) : f && Q ? (Ng(a.G[x - 1][z], h, n, !1), Ng(a.G[x + 1][z], h, n, !1)) : f && na ? (Ng(a.G[x - 1][z], h, n, !1), Ng(a.G[x - 1][z - 1], h, s, !0), Ng(a.G[x][z - 1], h, l, !1), Ng(a.G[x + 1][z + 1], h, s, !0)) : O && K ? (Ng(a.G[x + 1][z], h, n, !1), Ng(a.G[x + 1][z + 1], h, u, !0), Ng(a.G[x][z + 1], h, l, !1), Ng(a.G[x - 1][z - 1], h, u, !0)) : O && V ? (Ng(a.G[x - 1][z], h, n, !1), Ng(a.G[x + 1][z], h, n, !1)) : O && na ? (Ng(a.G[x - 1][z], h, n, !1), Ng(a.G[x - 1][z + 1], h, y, !0), Ng(a.G[x][z + 1], h, l, !1), Ng(a.G[x + 1][z - 1], h, y, !0)) : la && K ? (Ng(a.G[x][z - 1], h, l, !1), Ng(a.G[x][z + 1], h, l, !1)) : la && V ? (Ng(a.G[x - 1][z], h, n, !1), Ng(a.G[x - 1][z - 1], h, s, !0), Ng(a.G[x][z - 1], h, l, !1), Ng(a.G[x + 1][z + 1], h, s, !0)) : la && Q ? (Ng(a.G[x - 1][z], h, n, !1), Ng(a.G[x - 1][z + 1], h, y, !0), Ng(a.G[x][z + 1], h, l, !1), Ng(a.G[x + 1][z - 1], h, y, !0)) : J && Q ? (Ng(a.G[x + 1][z], h, n, !1), Ng(a.G[x + 1][z + 1], h, u, !0), Ng(a.G[x][z + 1], h, l, !1), Ng(a.G[x - 1][z - 1], h, u, !0)) : J && V ? (Ng(a.G[x + 1][z], h, n, !1), Ng(a.G[x + 1][z - 1], h, p, !0), Ng(a.G[x][z - 1], h, l, !1), Ng(a.G[x - 1][z + 1], h, p, !0)) : J && na && (Ng(a.G[x][z - 1], h, l, !1), Ng(a.G[x][z + 1], h, l, !1))),
        N = d
    }
}
function Ng(a, b, c, d) {
    1 !== a.Rb && (a.Qa(b), !d && a.Yf || a.ea(c))
};
function Og(a, b, c) {
    this.fl = a;
    this.Nj = b;
    this.G = c;
    this.oB = new Pg;
    this.Ip = [];
    this.Sw = [];
    this.Cl = this.Bl = null
}
function Qg(a, b) {
    var c = "" + (b.Ai() * a.Nj + b.Bi()),
    d = a.Sw.indexOf(c);
    if ( - 1 < d) d = a.Ip[d];
    else {
        d = a.oB;
        if (0 < d.nx.length) {
            var f = d = d.nx.shift();
            f.Fl = a;
            f.ss = b;
            f.xk = 0;
            f.Ko = -1;
            f.rl = null;
            f.It = !1;
            f.closed = !1;
            t(f.gh, b.Ai(), b.Bi());
            f.Hs.length = 0
        } else d = new Rg(a, b);
        a.Ip.push(d);
        a.Sw.push(c)
    }
    return d
}
function Sg(a, b, c, d, f) {
    return 0 > b - 1 || 0 > c - 1 || b + 1 >= a.fl || c + 1 >= a.Nj ? !1 : yg(a.Bl, b, c) ? !Tg(b, c, a.Bl) : yg(a.Cl, b, c) ? !Tg(b, c, a.Cl) : zg(a.Bl, b, c) || zg(a.Cl, b, c) ? !d: 0 === f || 2 === f ? a.G[b - 1][c].Rb === rg && a.G[b + 1][c].Rb === rg: a.G[b][c - 1].Rb === rg && a.G[b][c + 1].Rb === rg
}
function Tg(a, b, c) {
    var d = c.ia,
    f = d + c.rb - 1,
    g = c.ja;
    return 2 > Math.abs(g - b) && (2 > Math.abs(d - a) || 2 > Math.abs(f - a)) || 2 > Math.abs(g + c.qb - 1 - b) && (2 > Math.abs(d - a) || 2 > Math.abs(f - a)) ? !0 : !1
};
function Rg(a, b) {
    this.Fl = a;
    this.ss = b;
    this.xk = 0;
    this.Ko = -1;
    this.rl = null;
    this.closed = this.It = !1;
    this.gh = new Za;
    t(this.gh, b.Ai(), b.Bi());
    this.Hs = []
}
function Ug(a) {
    var b;
    b = a.rl ? Ug(a.rl) : [];
    var c = new Za;
    $a(c, a.gh);
    b.push(c);
    return b
};
function Pg() {
    this.nx = []
};
function Vg() {
    this.Ui = []
}
Vg.prototype.push = function(a) {
    var b, c = a.xk + a.Ko;
    for (b = 0; b < this.Ui.length; b++) {
        var d = this.Ui[b];
        if (c <= d.xk + d.Ko) {
            this.Ui.splice(b, 0, a);
            return
        }
    }
    this.Ui.push(a)
};
Vg.prototype.pop = function() {
    return this.Ui.shift()
};
Vg.prototype.remove = function(a) {
    a = this.Ui.indexOf(a); - 1 !== a ? this.Ui.splice(a, 1) : console.log("failed to find node in queue for removal!!!!!!!!!!")
};
function Wg(a, b, c) {
    this.G = c;
    this.Fl = new Og(a, b, c);
    this.open = new Vg
}
function Xg(a, b, c) {
    var d = a.G[b.ia + b.rb / 2 | 0][b.ja + b.qb / 2 | 0],
    f = a.G[c.ia + c.rb / 2 | 0][c.ja + c.qb / 2 | 0],
    g = a.Fl;
    g.Bl = b;
    g.Cl = c;
    a: {
        var g = Qg(a.Fl, d),
        f = Qg(a.Fl, f),
        h,
        l,
        n,
        p,
        s,
        d = 0;
        a.open.Ui.length = 0;
        a.open.push(g);
        for (g.It = !0; 0 < a.open.Ui.length;) {
            d++;
            if (500 < d) {
                console.log("path finding failure. too many iterations");
                f = null;
                break a
            }
            g = a.open.pop();
            if (g.ss === f.ss) {
                f = Ug(g);
                break a
            }
            g.closed = !0;
            h = g;
            if (0 === h.Hs.length) {
                l = h.Fl;
                n = h.ss;
                p = h.Hs;
                s = n.Ai();
                n = n.Bi();
                var u = !(yg(l.Bl, s, n) || yg(l.Cl, s, n)) && (zg(l.Bl, s, n) || zg(l.Cl, s, n));
                Sg(l, s, n - 1, u, 0) && p.push(Qg(l, l.G[s][n - 1]));
                Sg(l, s - 1, n, u, 3) && p.push(Qg(l, l.G[s - 1][n]));
                Sg(l, s + 1, n, u, 1) && p.push(Qg(l, l.G[s + 1][n]));
                Sg(l, s, n + 1, u, 2) && p.push(Qg(l, l.G[s][n + 1]))
            }
            h = h.Hs;
            for (s = 0; s < h.length; s++) if (l = h[s], !l.closed && (p = g.xk + l.gh.ac(g.gh), n = l.It, !n || p < l.xk)) l.rl = g,
            n ? (a.open.remove(l), l.xk = p) : (0 > l.Ko && (n = l.rl ? (n = l.rl.rl) && l.gh.T !== n.gh.T && l.gh.U !== n.gh.U ? 1.3 : 1 : 1, l.Ko = l.gh.ac(f.gh) * n), l.xk = p, l.It = !0),
            a.open.push(l)
        }
        console.log("ran out of open nodes before finding path");
        f = null
    }
    a = a.Fl;
    for (d = 0; d < a.Ip.length; d++) a.oB.nx.push(a.Ip[d]);
    a.Ip.length = 0;
    a.Sw.length = 0;
    if (a = f) {
        g = new Hg(b);
        h = new Hg(c);
        l = new Kg(b, g, c, h);
        b.Nc.push(g);
        c.Nc.push(h);
        g.Yk = l;
        h.Yk = l;
        for (f = 0; f < a.length; f++) if (d = a[f], !yg(b, d.T, d.U) && !yg(c, d.T, d.U)) {
            if (yg(c, d.T, d.U)) break;
            zg(b, d.T, d.U) ? (p = g, s = d.T, n = d.U, p.wj = s, p.xj = n, p.me = s * w.B, p.ne = n * w.B, g.Ho = d.T != a[f + 1].T) : zg(c, d.T, d.U) && (p = h, s = d.T, n = d.U, p.wj = s, p.xj = n, p.me = s * w.B, p.ne = n * w.B, h.Ho = d.T != a[f - 1].T);
            l.Sk.push(d)
        }
        b = l
    } else b = null;
    return b
};
function Yg(a, b, c, d, f) {
    this.wa = d;
    this.fl = a;
    this.Nj = b;
    this.G = c;
    this.Aj = f;
    this.iB = Zg;
    this.Ow = $g;
    this.xA = ah;
    this.wA = 15;
    this.DA = 8;
    this.Pa = [];
    this.gd = [];
    this.tf = this.Ce = null;
    this.Xp = this.Zo = 0
}
e = Yg.prototype;
e.rw = function() {
    this.Xp = this.Zo = 0;
    this.Pa.length = 0;
    this.gd.length = 0;
    this.tf = this.Ce = null;
    a: {
        var a = this.Ow + ma(this.wa, this.xA - this.Ow),
        b,
        c,
        d = this.DA,
        f = this.wA,
        g,
        h,
        l = 0;
        for (b = 0; b < a; b++) {
            g = d + ma(this.wa, f - d);
            h = d + ma(this.wa, f - d);
            c = new tg(1 + ma(this.wa, this.fl - g - 1), 1 + ma(this.wa, this.Nj - h - 1), g, h, 0);
            for (l = 0; bh(this, c);) {
                var n = c,
                p = 1 + ma(this.wa, this.fl - g - 1),
                s = 1 + ma(this.wa, this.Nj - h - 1);
                n.ia = p;
                n.ja = s;
                l++;
                if (15 < l) break a
            }
            g = this.Xp++;
            c.fk = g;
            this.Pa.push(c);
            g = c;
            this.yx(g);
            h = void 0;
            for (h = 0; 3 > h; h++) 0.5 > this.wa.random() ? (this.shiftLeft(g), this.gt(g)) : (this.gt(g), this.shiftLeft(g));
            c.Bq(this.G)
        }
    }
    return this.ru() ? this.uu() ? !0 : (console.log("failed to create stairs."), !1) : !1
};
e.ru = function() {
    var a, b, c, d = [],
    f,
    g,
    h = new Wg(this.fl, this.Nj, this.G);
    for (a = 1; a < this.Pa.length; a++) {
        b = this.Pa[a];
        d.length = 0;
        c = ch(this, this.Pa[a - 1], d, b);
        g = Date.now();
        f = Xg(h, b, c);
        if (!f) return a = Date.now(),
        console.log("Failed to generate hallway in " + (a - g) + " millis"),
        !1;
        g = this.Zo++;
        f.Or = g;
        this.gd.push(f);
        f.Bq(this.G);
        c.ro.push(b);
        b.ro.push(c)
    }
    return ! 0
};
e.uu = function() {
    for (var a = this.Pa[ma(this.wa, this.Pa.length)], b = this.Pa[ma(this.wa, this.Pa.length)]; b === a;) b = this.Pa[ma(this.wa, this.Pa.length)];
    var c = !1;
    w.Mc ? (c = w.Mc, c = c.ri >= c.rs - 1) : w.le && (c = !0);
    c = c ? !this.Aj: this.Aj;
    this.Ce = this.to(a, !this.Aj);
    this.tf = this.to(b, c);
    return null != this.Ce && null != this.tf
};
e.to = function(a, b) {
    var c;
    0.5 > this.wa.random() ? (c = dh(this, a, b)) || (c = eh(this, a, b)) : (c = eh(this, a, b)) || (c = dh(this, a, b));
    return c ? a.Za = c: null
};
function dh(a, b, c) {
    var d = b.Nc,
    f = 0,
    g, h, l = b.ja - 1;
    h = b.ia + ma(a.wa, b.rb);
    for (g = !a.dl(d, h, l); ! g && 6 > f;) f++,
    h = b.ia + ma(a.wa, b.rb),
    g = !a.dl(d, h, l);
    if (!g) return null;
    a = new Ig(b);
    a.Fq = !1;
    Jg(a, h, l);
    a.sq = c;
    return a
}
function eh(a, b, c) {
    var d = b.Nc,
    f = 0,
    g, h = b.ia - 1,
    l;
    l = b.ja + ma(a.wa, b.qb);
    for (g = !a.dl(d, h, l); ! g && 6 > f;) f++,
    l = b.ja + ma(a.wa, b.qb),
    g = !a.dl(d, h, l);
    if (!g) return null;
    a = new Ig(b);
    a.Fq = !0;
    Jg(a, h, l);
    a.sq = c;
    return a
}
e.dl = function(a, b, c) {
    var d;
    for (d = 0; d < a.length; d++) if (1 >= Math.abs(a[d].wj - b) && 1 >= Math.abs(a[d].xj - c)) return ! 0;
    return ! 1
};
function ch(a, b, c, d) {
    c.push(b);
    var f = b.ro;
    if (0 === f.length) return b;
    var g = b.Ud(d),
    h,
    l,
    n;
    for (n = 0; n < f.length; n++) h = f[n],
    0 <= c.indexOf(h) || h === d || (h = ch(a, h, c, d), l = h.Ud(d), l < g && (g = l, b = h));
    return b
}
e.yx = function(a) {
    var b, c;
    for (b = !0; b;) {
        b = a.ia;
        c = a.ja;
        if (1 === b && 1 === c) break;
        a.yx();
        if (bh(this, a)) {
            var d = a;
            d.ia = b;
            d.ja = c;
            b = !1
        } else b = !0
    }
};
e.shiftLeft = function(a) {
    var b, c;
    for (b = !0; b;) {
        b = a.ia;
        c = a.ja;
        if (1 === b) break;
        a.shiftLeft();
        if (bh(this, a)) {
            var d = a;
            d.ia = b;
            d.ja = c;
            b = !1
        } else b = !0
    }
};
e.gt = function(a) {
    var b, c;
    for (b = !0; b;) {
        b = a.ia;
        c = a.ja;
        if (1 === c) break;
        a.gt();
        if (bh(this, a)) {
            var d = a;
            d.ia = b;
            d.ja = c;
            b = !1
        } else b = !0
    }
};
function bh(a, b) {
    var c, d;
    for (c = 0; c < a.Pa.length; c++) {
        d = a.Pa[c];
        var f;
        if (f = b !== d) f = a.iB,
        f = !(b.ia + b.rb + f < d.ia || b.ia > d.ia + d.rb + f || b.ja + b.qb + f < d.ja || b.ja > d.ja + d.qb + f);
        if (f) return ! 0
    }
    return ! 1
};
function fh(a, b, c, d) {
    this.wa = d;
    this.fl = a;
    this.Nj = b;
    this.G = c;
    this.iB = 5;
    this.Ow = 4;
    this.xA = 9;
    this.wA = 18;
    this.DA = 6;
    this.Pa = [];
    this.gd = [];
    this.tf = this.Ce = null;
    this.Xp = this.Zo = 0
}
e = fh.prototype;
e.rw = function() {
    this.Xp = this.Zo = 0;
    this.Pa.length = 0;
    this.gd.length = 0;
    this.tf = this.Ce = null;
    gh(this, 1, 1, 15, 15, 1);
    gh(this, 51, 1, 15, 15, 1);
    gh(this, 56, 31, 5, 5, 3);
    gh(this, 51, 46, 15, 15, 1);
    gh(this, 1, 46, 15, 15, 1);
    gh(this, 1, 69, 15, 15, 2);
    gh(this, 27, 74, 5, 5, 3);
    this.ru();
    this.uu()
};
function gh(a, b, c, d, f, g) {
    b = new tg(b, c, d, f, g);
    c = a.Xp++;
    b.fk = c;
    a.Pa.push(b);
    b.Bq(a.G)
}
e.ru = function() {
    var a, b, c, d, f = new Wg(this.fl, this.Nj, this.G);
    for (a = 1; a < this.Pa.length; a++) if (b = this.Pa[a - 1], c = this.Pa[a], d = Xg(f, b, c)) {
        var g = this.Zo++;
        d.Or = g;
        this.gd.push(d);
        d.Bq(this.G);
        c.ro.push(b);
        b.ro.push(c)
    } else console.log("failed to generate hallway. bummer.")
};
e.uu = function() {
    var a = this.Pa[this.Pa.length - 1];
    this.Ce = this.to(this.Pa[0], !1);
    this.tf = this.to(a, !1)
};
e.to = function(a, b) {
    var c = new Ig(a),
    d = a.Nc,
    f,
    g;
    if (0.5 > Math.random()) {
        f = a.ia - 1;
        for (g = a.ja + ma(this.wa, a.qb); this.dl(d, f, g);) g = a.ja + ma(this.wa, a.qb);
        c.Fq = !0
    } else {
        g = a.ja - 1;
        for (f = a.ia + ma(this.wa, a.rb); this.dl(d, f, g);) f = a.ia + ma(this.wa, a.rb);
        c.Fq = !1
    }
    Jg(c, f, g);
    c.sq = b;
    return a.Za = c
};
e.dl = function(a, b, c) {
    var d;
    for (d = 0; d < a.length; d++) if (1 >= Math.abs(a[d].wj - b) && 1 >= Math.abs(a[d].xj - c)) return ! 0;
    return ! 1
};
function hh() {
    this.yh = new Za;
    this.wa = new ga(3)
}
hh.prototype.Xw = function(a) {
    var b = a.ia,
    c = a.ja - 1;
    a = b + 1 + ma(this.wa, b + a.rb - 1 - b - 2);
    t(this.yh, a, c);
    return this.yh
};
hh.prototype.Zw = function(a) {
    var b = a.ia - 1,
    c = a.ja;
    a = c + 1 + ma(this.wa, c + a.qb - 1 - c - 2);
    t(this.yh, b, a);
    return this.yh
};
function ih() {
    this.Li = this.Ki = 0;
    this.rc = this.sc = 120;
    this.G = null;
    this.Pa = [];
    this.gd = [];
    this.tf = this.Ce = null;
    this.sp = 0
}
function Jd(a, b, c, d) {
    var f = w.Ba;
    f.sp = a;
    var g = new ga(a);
    f.Pa.length = 0;
    f.gd.length = 0;
    f.Ce = null;
    f.tf = null;
    f.G ? jh(f) : f.Aw();
    if (11 === b) c = new fh(f.rc, f.sc, f.G, g),
    c.rw();
    else for (a = 0, c = new Yg(f.rc, f.sc, f.G, g, c); ! c.rw();) console.log("Level generation failed for seed: " + f.sp + " attempt: " + a),
    a++,
    f.sp++,
    new ga(f.sp),
    jh(f);
    f.Pa = c.Pa;
    f.gd = c.gd;
    f.Ce = c.Ce;
    f.tf = c.tf;
    c = od(b);
    for (b = 0; b < f.Pa.length; b++) f.Pa[b].xx(c, f.G);
    for (b = 0; b < f.gd.length; b++) f.gd[b].xx(c, f.G);
    $d();
    b = w.ff;
    0 < b.pe.length && (b.pe.length = 0);
    b = w.Uh;
    0 < b.kf.length && (b.kf.length = 0);
    b = w.Ti;
    0 < b.Hf.length && (b.Hf.length = 0);
    b = w.th;
    0 < b.Mn.length && (b.Mn.length = 0, b.Dt = {});
    kh();
    Id();
    oc();
    lh();
    if (d) {
        Ag(f.Ce.$d);
        d = f.Ce.$d;
        c = Qd();
        for (b = 0; b < c.length; b++) {
            var g = c[b],
            h = d;
            a = g.p;
            a.cd = null;
            a.w = h;
            g.Y = Sd;
            Rd(a);
            g = h.Za;
            t(a.u, g.tq, g.uq)
        }
        mh(d);
        nh(f.Ce.$d)
    }
}
ih.prototype.Aw = function() {
    var a, b, c, d, f;
    this.G = [];
    for (b = 0; b < this.rc; b++) {
        c = [];
        d = b * w.B;
        for (a = 0; a < this.sc; a++) f = a * w.B,
        c.push(new qg(b, a, d, f));
        this.G.push(c)
    }
};
function jh(a) {
    var b, c, d;
    for (c = 0; c < a.rc; c++) for (d = a.G[c], b = 0; b < a.sc; b++) {
        var f = d[b];
        f.Jn = null;
        f.Yf = null;
        f.bt = null;
        f.Rb = rg;
        f.Pq = null;
        f.li = 0
    }
}
ih.prototype.hb = function(a, b) {
    return 0 > a || a >= this.rc || 0 > b || b >= this.sc ? null: this.G[a][b]
};
ih.prototype.Ai = function(a) {
    return a / w.B | 0
};
ih.prototype.Bi = function(a) {
    return a / w.B | 0
};
function oh(a) {
    var b = w.Ba,
    c;
    for (c = 0; c < b.Pa.length; c++) if (b.Pa[c].fk === a) return b.Pa[c];
    return null
};
function ph(a, b) {
    this.text = a;
    this.SE = b;
    this.De = this.yt = this.xt = 0;
    var c = 1 + k(1);
    this.GD = 0.5 > Math.random() ? -c: c;
    this.HD = -1 + -k(1);
    this.pw = !0
}
ph.prototype.oy = function() {
    this.pw && (0.5 > Math.random() && (this.xt += this.GD), this.yt += this.HD);
    this.pw = !this.pw;
    this.De++;
    return 60 <= this.De
};
function qh() {
    this.al = [];
    this.dA = this.cA = 20
}
function rh(a, b) {
    var c = w.pc;
    0 < b && sh(c, a, "-" + b, "#FF4444")
}
function sh(a, b, c, d) {
    if (!w.ig) {
        c = new ph(c, d);
        b = b.p;
        if (w.wb) {
            d = b.dc();
            var f = b.ec();
            b = w.Sf + (d - w.S.he - (f - w.S.ie)) + a.cA;
            d = w.Tf + 0.5 * (d - w.S.he + (f - w.S.ie)) + a.dA
        } else d = b.Ob(),
        f = b.Pb(),
        b = th(d, f) + a.cA,
        d = uh(d, f) + a.dA;
        c.xt = b;
        c.yt = d;
        a.al.push(c)
    }
}
qh.prototype.oy = function() {
    var a, b = !1;
    for (a = 0; a < this.al.length; a++) this.al[a].oy() && (b = !0);
    if (b) for (a = this.al.length - 1; 0 <= a; a--) 60 <= this.al[a].De && this.al.splice(a, 1)
};
function vh() {
    this.Ar = 0;
    this.fw = "";
    this.ym = !0;
    this.du = !1
}
function Id() {
    var a = w.i.Xg;
    a.Ar = 0;
    a.fw = "";
    a.ym = !0;
    a.du = !1
}
function wh(a, b) {
    var c = w.i.Xg;
    c.Ar++;
    c.fw = a;
    c.ym = !1;
    c.du = b
}
vh.prototype.ol = function() {
    if (1 > xh().length) {
        this.ym = !0;
        w.i.aa.es();
        kh();
        Kd(yh);
        var a, b;
        for (a = 0; a < w.i.D.length; a++) b = w.i.D[a].Ja,
        b.Kf && (b.Kf = !1, zh(b))
    }
};
function mh(a) {
    var b = w.lD;
    if (w.i.Xg.ym) {
        var c = a.Yp;
        if (0 === c) if (Qh.t && 0.2 > Math.random()) Rh(b, a);
        else {
            var c = E.Ym.t,
            d = Math.max(E.Pj.t, c),
            c = c + k(d - c),
            c = c + Sh.t;
            if (0 < c) {
                for (var d = w.ob,
                f = d.hd + k(1 + d.fc - d.hd), d = Th(d, f), d = d[k(d.length)], f = d.xd, b = b.dn.Vk(d.nE) + " (等级." + f + ")", f = 0; f < c; f++) {
                    var g = w.Gf,
                    h = a,
                    l = d,
                    n = new Uh("Monster", Vh, 12, Wh, null),
                    p = n.K;
                    n.ee = l.ll;
                    n.gq(l);
                    p.Eb = l.xd;
                    n.Fh = new Xh(h, Yh);
                    n.p.w = h;
                    Zh.t ? (p.sd.Pc = m(0.7 * l.Gp), p.je.Pc = m(0.7 * l.Ep), p.xe.Pc = m(0.7 * l.Fp), p.Ae.Pc = m(0.7 * l.Hp), p.Jb.Pc = m(0.7 * l.$o), p.Sa = m(m(0.7 * $h(p.Jb)))) : (p.sd.Pc = l.Gp, p.je.Pc = l.Ep, p.xe.Pc = l.Fp, p.Ae.Pc = l.Hp, p.Jb.Pc = l.$o, p.Sa = m($h(p.Jb)));
                    var s = ug(h) + w.B,
                    l = wg(h) + w.B,
                    p = xg(h) - w.B,
                    h = s + k(vg(h) - w.B - s),
                    l = l + k(p - l);
                    t(n.p.u, h, l);
                    g.Pi.push(n)
                }
                wh(b, !1)
            }
        } else 1 === c ? (c = Math.max(E.Pj.xf, E.Ym.t), d = Math.max(E.Pj.t, c), d = c + k(d - c), c = w.ob.fc, d += Sh.t, ai(d, a), a = w.le ? bi(b.dn, w.le.mi) : bi(b.dn, "Unknown Castle"), wh(a + " (等级." + c + ")", !1)) : 2 === c && Rh(b, a)
    }
}
function Rh(a, b) {
    var c = ci(w.i.da),
    d;
    d = w.le ? di(a.dn, w.le.mi) : w.Mc ? di(a.dn, w.Mc.Eo) : di(a.dn, "Unknown Castle");
    var f = ei[k(ei.length)];
    d = d + " (等级." + c + ")";
    var g = w.Gf,
    h = new fi(gi.Ka, f.d, c),
    f = new Uh(gi.za, 4, gi.pa, gi, null),
    l = f.K;
    f.gq(h);
    f.ee = h.ll;
    h = hi(gi.nb());
    f.Fh = h;
    ii(f, c);
    l.Eb = c;
    ji(l, c, gi.Ma);
    if (gi.eu) for (c = 0; c < gi.eu.length; c++) ki(f, new li(gi.eu[c]));
    c = f.p;
    c.w = b;
    c.cd = null;
    var n = ug(b) + w.B,
    l = wg(b) + w.B,
    h = xg(b) - w.B,
    n = n + k(vg(b) - w.B - n),
    l = l + k(h - l);
    t(c.u, n, l);
    mi(f, gi.WC);
    g.Pi.push(f);
    g = Math.max(E.Pj.xf, E.Ym.t);
    f = Math.max(E.Pj.t, g);
    g += k(f - g);
    g += Sh.t;
    ai(g, b);
    wh(d, !0)
}
function ai(a, b) {
    var c, d = w.ob.fc,
    f;
    if (0.5 > Math.random()) for (c = 0; c < a; c++) f = ni[k(ni.length)],
    f = oi(f, d, b),
    w.Gf.Pi.push(f);
    else for (f = ni[k(ni.length)], c = 0; c < a; c++) {
        var g = oi(f, d, b);
        w.Gf.Pi.push(g)
    }
};
function pi() {
    this.Pf = []
}
function Qd() {
    return w.$h.Pf
}
function qi(a) {
    var b = w.$h;
    return a.Ja.bi ? ri(a) ? xh() : b.Pf: ri(a) ? b.Pf: xh()
}
function si(a) {
    var b = w.$h;
    return ri(a) ? xh() : b.Pf
}
pi.prototype.J = function() {
    0 < this.Pf.length && (console.log("teams array in invalid state on party creation"), this.Pf.length = 0);
    var a = w.i.D,
    b;
    for (b = 0; b < a.length; b++) this.Pf.push(a[b])
};
pi.prototype.Tt = function(a) {
    this.Pf.push(a)
};
function fi(a, b, c) {
    this.dE = a;
    this.nE = ra(a, "y") ? a.substring(0, a.length - 1) + "": ra(a, "Man") ? a.substring(0, a.length - 3) + "Men": ra(a, "fish") ? a: a + "";
    this.d = b;
    this.xd = c;
    this.ll = w.fh.v(b);
    this.$o = this.Sj = this.Hp = this.Fp = this.Ep = this.Gp = this.No = this.ek = this.ml = this.xq = 0;
    ti(this)
}
fi.prototype.Vk = function() {
    return this.dE
};
function ui(a) {
    a.xq++;
    a.ml++;
    a.ml >= a.ek && 5 > a.Sj && (a.ml -= a.ek, ti(a))
}
function ti(a) {
    if (! (5 <= a.Sj)) {
        a.Sj++;
        a.ek += vi;
        var b = 10 * (a.xd - 1) + a.Sj;
        a.$o = Ia(b, wi, 1);
        a.No = Ia(b, xi, 1);
        a.Gp = Ia(b, yi, 1);
        a.Ep = Ia(b, zi, 1);
        a.Fp = Ia(b, Ai, 1);
        a.Hp = Ia(b, Bi, 1)
    }
};
function Ci() {
    this.Pw = "沉溺的;惊人的;腐坏的;敏捷的;好斗的;冷漠的;愤怒的;敌对的;弯曲的;狡猾的;对抗的;可恶的;讨厌的;血腥的;沉思的;勇敢的;无耻的;破碎的;基础的;漂亮的;对抗的;聪明的;诅咒的;谴责的;神秘的;恐怖的;懦弱的;刻薄的;混乱的;天上的;黑暗的;恐惧的;不满的;失宠的;贫穷的;伪装的;喝醉的;悲惨的;卑鄙的;恶心的;不安的;羞辱的;宅男的;著名的;绝望的;可憎的;开除的;兴奋的;进取的;可怕的;冰冻的;火焰的;惊恐的;可怕的;有爱的;恶魔的;友善的;吓人的;皮毛的;堕落的;虚弱的;冻结的;传说的;凶猛的;未来的;狂乱的;疯狂的;可怕的;预感的;强大的;遗忘的;残忍的;阴森的;郁闷的;惊人的;催眠的;可憎的;错误的;肮脏的;无瑕的;沉醉的;难耐的;智能的;无礼的;缺陷的;监禁的;发炎的;讨厌的;不朽的;险恶的;无情的;厚重的;高尚的;噩梦的;有序的;失格的;卑劣的;丑恶的;资深的;浮华的;投机的;冒险的;掠夺的;阶段的;多产的;幽默的;性感的;邪门的;悚然的;特殊的;灭魂的;狂暴的;浮夸的;严肃的;机密的;阴影的;卑鄙的;反感的;矛盾的;威胁的;糟糕的;浑浊的;高耸的;不幸的;离群的;不正的;无益的;倔强的;亵渎的;无道的;缺德的;无德的;不死的;过去的;呆板的".split(";");
    this.XC = "男爵 首领 教主 首席 独裁者 主管 君主 国王 太保 领主 巨头 帝王 主人 霸王 督导 王子 总统 统治者 元首 苏丹 寡头".split(" ");
    this.oD = "遗弃的 美丽的 破碎的 燃烧的 反叛的 贫瘠的 痛苦的 血液的 血腥的 困扰的 毁坏的 结晶的 寒冷的 死亡的 深渊的 黑暗的 雾霾的 遥远的 烦扰的 荒凉的 发狂的 潮湿的 矮胖的 恶心的 不安的 发狂的 乌木的 冻结的 孤单的 忘却的 禁止的 畏惧的 金典的 黑暗的 潮湿的 感染的 绝命的 迷失的 残忍的 神秘的 模糊的 幽冥的 美好的 就近的 肮脏 顽皮的 普通的 北方的 苍白的 污染的 粉碎的 阴影的 秘密的 覆盖的 痛苦的 悲伤地 折磨的 虐待的 亵渎的 未知的 无名的 卑鄙的 窃语的".split(" ");
    this.mE = "学院;沼泽;废矿;洞穴;地穴;城市;山洞;峡谷;黑暗;领域;地牢;次元;区域;梦想;帝国;森林;工厂;墓地;洞穴;地狱;山谷;地狱景象;阴间;王国;国土;图书馆;沼泽;陵墓;太平间;泥泞平原;附近;位面;省;大门;行星;领域;过往;坑;宫殿;河流;河流水域;丛林;沼泽;屠宰场;郊外;冻土;地形;坟墓;寺庙;塔;地底".split(";")
}
Ci.prototype.mn = function(a) {
    return a[k(a.length)]
};
function bi(a, b) {
    return b + "之" + a.mn(a.Pw)
}
function di(a, b) {
    return b + "之" + a.mn(a.Pw) + "" + a.mn(a.XC)
}
Ci.prototype.Vk = function(a) {
    return 0.5 > Math.random() ? this.mn(this.Pw) + "" + a: this.mn(this.oD) + "" + this.mn(this.mE) + "的" + a
};
function Th(a, b) {
    b < a.hd && console.log("getMonsterTypesForLevel. monsterLevel (" + b + ") less than min unlocked level: " + a.hd);
    b > a.fc + 1 && console.log("getMonsterTypesForLevel. monsterLevel (" + b + ") greater than max unlocked level: " + a.fc);
    var c = b + "",
    d = a.en[c];
    if (!d) {
        for (var d = [], f = [], g, h = 0; 20 > d.length;) g = a.n[k(a.n.length)],
        -1 < f.indexOf(g) || (f.push(g), d.push(new fi(g.o, g.d, b)), h++);
        d.sort(a.HE);
        a.en[c] = d
    }
    return d
};
function Di() {
    this.Pi = [];
    this.Og = [];
    this.aE = 50
}
function xh() {
    return w.Gf.Pi
}
function lh() {
    var a = w.Gf;
    0 != a.Pi.length && (a.Pi.length = 0);
    0 != a.Og.length && (a.Og.length = 0)
}
Di.prototype.ol = function(a) {
    if (a) {
        var b = this.Pi.indexOf(a); - 1 < b && this.Pi.splice(b, 1);
        for (this.Og.push(a); this.Og.length > this.aE;) this.Og.shift()
    }
};
function Eg(a, b, c, d) {
    this.Xl = a;
    this.Xo = b;
    this.Yo = c;
    this.vD = d;
    this.gc = !1;
    this.Zc = null;
    this.ph = 0
}
Eg.prototype.oh = function(a) {
    this.gc = a
};
Eg.prototype.Re = function(a) {
    this.Zc = a
};
Eg.prototype.Ud = function() {
    return this.ph
};
Eg.prototype.Se = function(a) {
    this.ph = a
};
function Ei() {
    this.pe = [];
    this.xw = this.xw = this.Sz = null
}
Ei.prototype.zl = function() {
    var a;
    for (a = 0; a < this.pe.length; a++) this.pe[a].Re(null),
    this.pe[a].Se(0)
};
function Fi(a) {
    var b = w.ff;
    a = b.pe.indexOf(a); - 1 < a && b.pe.splice(a, 1)
};
function Gi(a, b, c, d, f) {
    this.zq = a;
    this.Aq = b;
    this.Nn = c;
    this.Kg = !1;
    this.Vy = f ? d.xh.closed: d.hh.closed;
    this.PA = f ? d.xh.Ec: d.hh.Ec;
    this.Mf = d.Mf;
    this.VE = f;
    this.BC = d;
    this.el = !1
}
function Hi(a, b) {
    if (a.Kg = b) a.el = !1,
    w.i.da.hq(null)
};
function Ii() {
    this.Mn = [];
    this.Dt = {};
    this.ve = [];
    this.yh = new Za
}
function nh(a) {
    var b = w.th,
    c = 0 < xh().length;
    if (!Ji(b, a)) {
        if (3 != a.Yp) {
            if (!c && 2 > a.Nc.length) return;
            c = E.Et.t / 100;
            if (Math.random() > c) return
        }
        var c = b.ve[k(b.ve.length)],
        d = 0.5 > Math.random(),
        f,
        g;
        f = !1;
        for (var h = 0; ! f && 10 > h;) g = d ? b.Zw(a) : b.Xw(a),
        (f = Cg(a, g)) || (g = null),
        h++; (f = g) ? (g = f.T * w.B, f = f.U * w.B, c.jh || (d ? g += w.B: f += w.B), a = new Gi(g, f, a, c, d), b.Mn.push(a), b.Dt[a.Nn.fk] = a) : console.log("failed to find treasure chest location.")
    }
}
Ii.prototype.Xw = function(a) {
    var b = a.ja;
    a = a.ia + k(a.rb);
    t(this.yh, a, b - 1);
    return this.yh
};
Ii.prototype.Zw = function(a) {
    var b = a.ia;
    a = a.ja + k(a.qb);
    t(this.yh, b - 1, a);
    return this.yh
};
function Ji(a, b) {
    return b ? a.Dt[b.fk] : null
};
var Ki = {
    X: 13,
    Te: "spritesheet/SpellFXAnim2.png",
    vd: "Bubbles",
    Od: 1,
    Pd: !1,
    Qd: 100,
    cf: "昏迷"
},
Li = {
    0 : {
        X: 0,
        Te: "spritesheet/SpellFXAnim4.png",
        vd: "Sleep",
        Od: 7,
        Pd: !0,
        Qd: 100,
        cf: "睡着"
    },
    1 : {
        X: 1,
        Te: "spritesheet/SpellFXAnim1.png",
        vd: "Spider Web",
        Od: 7,
        Pd: !0,
        Qd: 100,
        cf: "定身"
    },
    3 : {
        X: 3,
        Te: "spritesheet/SpellFXAnim4.png",
        vd: "Blind Eye Blink",
        Od: 7,
        Pd: !0,
        Qd: 100,
        cf: "失明"
    },
    4 : {
        X: 4,
        Te: "spritesheet/SpellFXAnim4.png",
        vd: "Red Eye Blink",
        Od: 6,
        Pd: !0,
        Qd: 100,
        cf: "转变"
    },
    5 : {
        X: 5,
        Te: "spritesheet/SpellFXAnim3.png",
        vd: "Shield",
        Od: 6,
        Pd: !1,
        Qd: 700,
        cf: "护甲提高"
    },
    6 : {
        X: 6,
        Te: "spritesheet/SpellFXAnim3.png",
        vd: "Arm Flex",
        Od: 0,
        Pd: !1,
        Qd: 700,
        cf: "伤害提高"
    },
    7 : {
        X: 7,
        Te: "spritesheet/SpellFXAnim4.png",
        vd: "Eagle",
        Od: 0,
        Pd: !1,
        Qd: 700,
        cf: "攻击等级提高"
    },
    8 : {
        X: 8,
        Te: "spritesheet/SpellFXAnim4.png",
        vd: "Armor",
        Od: 3,
        Pd: !1,
        Qd: 700,
        cf: "防御等级提高"
    },
    9 : {
        X: 9,
        Te: "spritesheet/SpellFXAnim3.png",
        vd: "Super Speed",
        Od: 0,
        Pd: !1,
        Qd: 100,
        cf: "迅捷"
    },
    10 : {
        X: 10,
        Te: "spritesheet/SpellFXAnim3.png",
        vd: "Target",
        Od: 8,
        Pd: !1,
        Qd: 50,
        cf: "怪物目标"
    },
    11 : {
        X: 11,
        Te: "spritesheet/SpellFXAnim3.png",
        vd: "Color Spiral",
        Od: 8,
        Pd: !1,
        Qd: 50,
        cf: "潜行模式"
    },
    12 : {
        X: 12,
        Te: "spritesheet/SpellFXAnim4.png",
        vd: "Totems",
        Od: 2,
        Pd: !1,
        Qd: 50,
        cf: "暴怒"
    }
};
Li[13] = Ki;
Li[14] = {
    X: 14,
    Te: "spritesheet/SpellFXAnim2.png",
    vd: "Bubbles",
    Od: 1,
    Pd: !1,
    Qd: 10,
    cf: "Stunned"
};
function Mi(a) {
    Ni(a.K);
    Oi(a, a.ei);
    Oi(a, a.fi);
    Oi(a, a.gi);
    Oi(a, a.hi)
}
function Oi(a, b) {
    var c = b.Ha,
    d, f;
    for (f = 0; f < c.length; f++) d = c[f],
    d.Na() === Pi && d.He() && (d = d.Jr(), Qi(a, d.f, d.g))
}
function mi(a, b) {
    if (b && 0 !== b.length) {
        var c, d;
        Ni(a.K);
        for (d = 0; d < b.length; d++) c = b[d],
        Qi(a, c.f, c.g)
    }
}
function Qi(a, b, c) {
    a = a.K;
    switch (b) {
    case 1:
        a.wo += c;
        break;
    case 2:
        b = a.sd;
        b.wc += c;
        break;
    case 3:
        b = a.je;
        b.wc += c;
        break;
    case 4:
        b = a.xe;
        b.wc += c;
        break;
    case 5:
        b = a.Ae;
        b.wc += c;
        break;
    case 6:
        b = a.Jb;
        b.wc += c;
        break;
    case 7:
        b = a.Ke;
        b.wc += c;
        break;
    case 8:
        a.ap += c;
        break;
    case 9:
        a.pq += c;
        break;
    case 10:
        a.ao += c;
        break;
    case 11:
        a.Ts += c;
        break;
    case 13:
        a.Ps += c;
        break;
    case 12:
        a.Rs += c;
        break;
    case 14:
        a.Qs += c;
        break;
    case 15:
        a.Ss += c;
        break;
    case 16:
        a.xn += c;
        break;
    case 17:
        a.lm += c;
        break;
    case 18:
        a.Oj += c;
        break;
    case 19:
        a.Wn += c;
        break;
    case 21:
        a.ar += c;
        break;
    case 20:
        a.mr += c;
        break;
    case 27:
        a.Ft += c;
        break;
    case 22:
        a.Qq += c;
        break;
    case 25:
        a.ho += 1;
        break;
    case 23:
        a.Df += c;
        break;
    case 24:
        a.Wi += c;
        100 < a.Wi && (a.Wi = 100);
        break;
    case 26:
        a.gl += c;
        break;
    case 28:
        a.vt += c;
        break;
    case 29:
        a.nt += c;
        break;
    case 30:
        a.ku = c;
        break;
    case 31:
        a.lu = c;
        break;
    case 32:
        a.mu = c
    }
};
var Ri = {
    c: "improvedDamageBarbarian1",
    title: "伤害提高 I",
    e: "10%伤害加成",
    g: 10,
    f: 2
},
Si = {
    c: "improvedDamageBarbarian2",
    title: "伤害提高 II",
    e: "10%伤害加成",
    g: 10,
    f: 2
},
Ti = {
    c: "improvedDamageBarbarian3",
    title: "伤害提高 III",
    e: "10%伤害加成",
    g: 10,
    f: 2
},
Ui = {
    c: "improvedArmorBarbarian1",
    title: "护甲提高 I",
    e: "10%护甲加成",
    g: 10,
    f: 3
},
Vi = {
    c: "improvedArmorBarbarian2",
    title: "护甲提高 II",
    e: "10%护甲加成",
    g: 10,
    f: 3
},
Wi = {
    c: "improvedArmorBarbarian3",
    title: "护甲提高 III",
    e: "10%护甲加成",
    g: 10,
    f: 3
},
Xi = {
    c: "improvedAttackRatingBarbarian1",
    title: "攻击等级提高 I",
    e: "10%攻击等级加成",
    g: 10,
    f: 4
},
Yi = {
    c: "improvedAttackRatingBarbarian2",
    title: "攻击等级提高 II",
    e: "10%攻击等级加成",
    g: 10,
    f: 4
},
Zi = {
    c: "improvedAttackRatingBarbarian3",
    title: "攻击等级提高 III",
    e: "10%攻击等级加成",
    g: 10,
    f: 4
},
$i = {
    c: "improvedDefenseRatingBarbarian1",
    title: "防御等级提高 I",
    e: "10%防御等级加成",
    g: 10,
    f: 5
},
aj = {
    c: "improvedDefenseRatingBarbarian2",
    title: "防御等级提高 II",
    e: "10%防御等级加成",
    g: 10,
    f: 5
},
bj = {
    c: "improvedDefenseRatingBarbarian3",
    title: "防御等级提高 III",
    e: "10%防御等级加成",
    g: 10,
    f: 5
},
lj = {
    c: "fasterAttacksBarbarian1",
    title: "快速攻击 I",
    e: "攻击冷却时间减少",
    g: 2,
    f: 10
},
mj = {
    c: "fasterAttacksBarbarian2",
    title: "快速攻击 II",
    e: "攻击冷却时间减少",
    g: 2,
    f: 10
},
nj = {
    c: "fasterAttacksBarbarian3",
    title: "快速攻击 III",
    e: "攻击冷却时间减少",
    g: 2,
    f: 10
},
oj = {
    c: "healthRegenerationBarbarian1",
    title: "快速生命回复 I",
    e: "生命回复速率+1%",
    g: 1,
    f: 8
},
pj = {
    c: "healthRegenerationBarbarian2",
    title: "快速生命回复 II",
    e: "生命回复速率+1%",
    g: 1,
    f: 8
},
qj = {
    c: "healthRegenerationBarbarian3",
    title: "快速生命回复 III",
    e: "生命回复速率+1%",
    g: 1,
    f: 8
},
rj = {
    c: "spiritRegenerationBarbarian1",
    title: "快速法力回复 I",
    e: "法力回复速率+1%",
    g: 1,
    f: 9
},
sj = {
    c: "spiritRegenerationBarbarian2",
    title: "快速法力回复 II",
    e: "法力回复速率+1%",
    g: 1,
    f: 9
},
tj = {
    c: "improvedHealthBarbarian1",
    title: "生命提高 I",
    e: "最大生命+20%",
    g: 20,
    f: 6
},
uj = {
    c: "improvedHealthBarbarian2",
    title: "生命提高 II",
    e: "最大生命+20%",
    g: 20,
    f: 6
},
vj = {
    c: "improvedHealthBarbarian3",
    title: "生命提高 III",
    e: "最大生命+20%",
    g: 20,
    f: 6
},
wj = {
    c: "improvedSpiritBarbarian1",
    title: "法力提高 I",
    e: "最大法力+20%",
    g: 20,
    f: 7
},
xj = {
    c: "improvedSpiritBarbarian2",
    title: "法力提高 II",
    e: "最大法力+20%",
    g: 20,
    f: 7
},
yj = {
    c: "ignoreDamageBarbarian1",
    title: "伤害免疫 I",
    e: "免疫10%敌人的伤害",
    g: 10,
    f: 1
},
zj = {
    c: "ignoreDamageBarbarian2",
    title: "伤害免疫 II",
    e: "免疫10%敌人的伤害",
    g: 10,
    f: 1
},
Aj = {
    c: "ignoreDamageBarbarian3",
    title: "伤害免疫 III",
    e: "免疫10%敌人的伤害",
    g: 10,
    f: 1
},
Bj = {
    c: "criticalHitChanceBarbarian1",
    title: "暴击几率",
    e: "暴击几率+5%",
    g: 5,
    f: 17
},
Cj = {
    c: "criticalHitChanceBarbarian2",
    title: "暴击几率",
    e: "暴击几率+5%",
    g: 5,
    f: 17
},
Dj = {
    c: "criticalHitChanceBarbarian3",
    title: "暴击几率",
    e: "暴击几率+5%",
    g: 5,
    f: 17
},
Ej = {
    c: "criticalHitChanceBarbarian4",
    title: "暴击几率",
    e: "暴击几率+5%",
    g: 5,
    f: 17
},
Fj = {
    c: "improvedSledgeHammerBarbarian1",
    title: "改进大锤 I",
    e: "大面积效果",
    g: 1,
    f: 25
},
Gj = {
    c: "improvedSledgeHammerBarbarian2",
    title: "改进大锤 II",
    e: "大面积效果",
    g: 1,
    f: 25
};
var Hj = {
    c: "improvedDamageFighter1",
    title: "伤害提高 I",
    e: "10%伤害加成",
    g: 10,
    f: 2
},
Ij = {
    c: "improvedDamageFighter2",
    title: "伤害提高 II",
    e: "10%伤害加成",
    g: 10,
    f: 2
},
Jj = {
    c: "improvedDamageFighter3",
    title: "伤害提高 III",
    e: "10%伤害加成",
    g: 10,
    f: 2
},
Kj = {
    c: "improvedArmorFighter1",
    title: "护甲提高 I",
    e: "10%护甲加成",
    g: 10,
    f: 3
},
Lj = {
    c: "improvedArmorFighter2",
    title: "护甲提高 II",
    e: "10%护甲加成",
    g: 10,
    f: 3
},
Mj = {
    c: "improvedArmorFighter3",
    title: "护甲提高 III",
    e: "10%护甲加成",
    g: 10,
    f: 3
},
Nj = {
    c: "improvedAttackRatingFighter1",
    title: "攻击等级提高 I",
    e: "10%攻击等级加成",
    g: 10,
    f: 4
},
Oj = {
    c: "improvedAttackRatingFighter2",
    title: "攻击等级提高 II",
    e: "10%攻击等级加成",
    g: 10,
    f: 4
},
Pj = {
    c: "improvedAttackRatingFighter3",
    title: "攻击等级提高 III",
    e: "10%攻击等级加成",
    g: 10,
    f: 4
},
Qj = {
    c: "improvedDefenseRatingFighter1",
    title: "防御等级提高 I",
    e: "10%防御等级加成",
    g: 10,
    f: 5
},
Rj = {
    c: "improvedDefenseRatingFighter2",
    title: "防御等级提高 II",
    e: "10%防御等级加成",
    g: 10,
    f: 5
},
Sj = {
    c: "improvedDefenseRatingFighter3",
    title: "防御等级提高 III",
    e: "10%防御等级加成",
    g: 10,
    f: 5
},
Tj = {
    c: "fasterAttacksFighter1",
    title: "快速攻击 I",
    e: "攻击冷却时间减少",
    g: 2,
    f: 10
},
Uj = {
    c: "fasterAttacksFighter2",
    title: "快速攻击 II",
    e: "攻击冷却时间减少",
    g: 2,
    f: 10
},
Vj = {
    c: "fasterAttacksFighter3",
    title: "快速攻击 III",
    e: "攻击冷却时间减少",
    g: 2,
    f: 10
},
Wj = {
    c: "healthRegenerationFighter1",
    title: "快速生命回复 I",
    e: "生命回复速率+1%",
    g: 1,
    f: 8
},
Xj = {
    c: "healthRegenerationFighter2",
    title: "快速生命回复 II",
    e: "生命回复速率+1%",
    g: 1,
    f: 8
},
Yj = {
    c: "healthRegenerationFighter3",
    title: "快速生命回复 III",
    e: "生命回复速率+1%",
    g: 1,
    f: 8
},
Zj = {
    c: "improvedHealthFighter1",
    title: "生命提高 I",
    e: "最大生命+20%",
    g: 20,
    f: 6
},
ak = {
    c: "improvedHealthFighter2",
    title: "生命提高 II",
    e: "最大生命+20%",
    g: 20,
    f: 6
},
bk = {
    c: "improvedHealthFighter3",
    title: "生命提高 III",
    e: "最大生命+20%",
    g: 20,
    f: 6
},
ck = {
    c: "ignoreDamageFighter1",
    title: "坦克模式",
    e: "免疫10%敌人的伤害",
    g: 10,
    f: 1
},
dk = {
    c: "ignoreDamageFighter2",
    title: "坦克 坦克 坦克",
    e: "免疫10%敌人的伤害",
    g: 10,
    f: 1
},
ek = {
    c: "ignoreDamageFighter3",
    title: "纯种坦克",
    e: "免疫10%敌人的伤害",
    g: 10,
    f: 1
},
fk = {
    c: "ignoreDamageFighter4",
    title: "主战坦克",
    e: "免疫10%敌人的伤害",
    g: 10,
    f: 1
},
gk = {
    c: "criticalHitChanceFighter1",
    title: "暴击几率",
    e: "暴击几率+5%",
    g: 5,
    f: 17
},
hk = {
    c: "criticalHitChanceFighter2",
    title: "临界暴击",
    e: "暴击几率+5%",
    g: 5,
    f: 17
},
ik = {
    c: "criticalHitChanceFighter3",
    title: "频繁暴击",
    e: "暴击几率+5%",
    g: 5,
    f: 17
},
jk = {
    c: "criticalHitChanceFighter4",
    title: "常常暴击",
    e: "暴击几率+5%",
    g: 5,
    f: 17
},
kk = {
    c: "attacksPerTurnFighter1",
    title: "反手",
    e: "每回合最大攻击次数+1",
    g: 1,
    f: 18
},
lk = {
    c: "attacksPerTurnFighter2",
    title: "旋风攻击",
    e: "每回合最大攻击次数+1",
    g: 1,
    f: 18
},
mk = {
    c: "attacksPerTurnFighter3",
    title: "惊叹攻击",
    e: "每回合最大攻击次数+1",
    g: 1,
    f: 18
},
nk = {
    c: "additionalAttackPercentFighter1",
    title: "额外攻击几率",
    e: "+20%额外攻击几率",
    g: 20,
    f: 19
},
ok = {
    c: "additionalAttackPercentFighter2",
    title: "额外攻击几率",
    e: "+20%额外攻击几率",
    g: 20,
    f: 19
},
pk = {
    c: "additionalAttackPercentFighter3",
    title: "额外攻击几率",
    e: "+20%额外攻击几率",
    g: 20,
    f: 19
};
var qk = {
    c: "improvedDamageNinja1",
    title: "伤害提高 I",
    e: "10%伤害加成",
    g: 10,
    f: 2
},
rk = {
    c: "improvedDamageNinja2",
    title: "伤害提高 II",
    e: "10%伤害加成",
    g: 10,
    f: 2
},
sk = {
    c: "improvedDamageNinja3",
    title: "伤害提高 III",
    e: "10%伤害加成",
    g: 10,
    f: 2
},
tk = {
    c: "improvedArmorNinja1",
    title: "护甲提高 I",
    e: "10%护甲加成",
    g: 10,
    f: 3
},
uk = {
    c: "improvedArmorNinja2",
    title: "护甲提高 II",
    e: "10%护甲加成",
    g: 10,
    f: 3
},
vk = {
    c: "improvedArmorNinja3",
    title: "护甲提高 III",
    e: "10%护甲加成",
    g: 10,
    f: 3
},
wk = {
    c: "improvedAttackRatingNinja1",
    title: "攻击等级提高 I",
    e: "10%攻击等级加成",
    g: 10,
    f: 4
},
xk = {
    c: "improvedAttackRatingNinja2",
    title: "攻击等级提高 II",
    e: "10%攻击等级加成",
    g: 10,
    f: 4
},
yk = {
    c: "improvedAttackRatingNinja3",
    title: "攻击等级提高 III",
    e: "10%攻击等级加成",
    g: 10,
    f: 4
},
zk = {
    c: "improvedDefenseRatingNinja1",
    title: "防御等级提高 I",
    e: "10%防御等级加成",
    g: 10,
    f: 5
},
Ak = {
    c: "improvedDefenseRatingNinja2",
    title: "防御等级提高 II",
    e: "10%防御等级加成",
    g: 10,
    f: 5
},
Bk = {
    c: "improvedDefenseRatingNinja3",
    title: "防御等级提高 III",
    e: "10%防御等级加成",
    g: 10,
    f: 5
},
Ck = {
    c: "fasterAttacksNinja1",
    title: "快速攻击 I",
    e: "攻击冷却时间减少",
    g: 2,
    f: 10
},
Dk = {
    c: "fasterAttacksNinja2",
    title: "快速攻击 II",
    e: "攻击冷却时间减少",
    g: 2,
    f: 10
},
Ek = {
    c: "fasterAttacksNinja3",
    title: "快速攻击 III",
    e: "攻击冷却时间减少",
    g: 2,
    f: 10
},
Fk = {
    c: "healthRegenerationNinja1",
    title: "快速生命回复 I",
    e: "生命回复速率+1%",
    g: 1,
    f: 8
},
Gk = {
    c: "healthRegenerationNinja2",
    title: "快速生命回复 II",
    e: "生命回复速率+1%",
    g: 1,
    f: 8
},
Hk = {
    c: "healthRegenerationNinja3",
    title: "快速生命回复 III",
    e: "生命回复速率+1%",
    g: 1,
    f: 8
},
Ik = {
    c: "improvedHealthNinja1",
    title: "生命提高 I",
    e: "最大生命+20%",
    g: 20,
    f: 6
},
Jk = {
    c: "improvedHealthNinja2",
    title: "生命提高 II",
    e: "最大生命+20%",
    g: 20,
    f: 6
},
Kk = {
    c: "improvedHealthNinja3",
    title: "生命提高 III",
    e: "最大生命+20%",
    g: 20,
    f: 6
},
Lk = {
    c: "criticalHitChanceNinja1",
    title: "暴击几率",
    e: "暴击几率+5%",
    g: 5,
    f: 17
},
Mk = {
    c: "criticalHitChanceNinja2",
    title: "暴击几率",
    e: "暴击几率+5%",
    g: 5,
    f: 17
},
Nk = {
    c: "criticalHitChanceNinja3",
    title: "暴击几率",
    e: "暴击几率+5%",
    g: 5,
    f: 17
},
Ok = {
    c: "criticalHitChanceNinja4",
    title: "暴击几率",
    e: "暴击几率+5%",
    g: 5,
    f: 17
},
Pk = {
    c: "criticalHitChanceNinja5",
    title: "暴击几率",
    e: "暴击几率+5%",
    g: 5,
    f: 17
},
Qk = {
    c: "attacksPerTurnNinja1",
    title: "额外打击",
    e: "每回合最大攻击次数+1",
    g: 1,
    f: 18
},
Rk = {
    c: "attacksPerTurnNinja2",
    title: "再次攻击",
    e: "每回合最大攻击次数+1",
    g: 1,
    f: 18
},
Sk = {
    c: "attacksPerTurnNinja3",
    title: "再次攻击",
    e: "每回合最大攻击次数+1",
    g: 1,
    f: 18
},
Tk = {
    c: "additionalAttackPercentNinja1",
    title: "额外攻击几率",
    e: "+10%额外攻击几率",
    g: 10,
    f: 19
},
Uk = {
    c: "additionalAttackPercentNinja2",
    title: "额外攻击几率",
    e: "+10%额外攻击几率",
    g: 10,
    f: 19
},
Vk = {
    c: "additionalAttackPercentNinja3",
    title: "额外攻击几率",
    e: "+10%额外攻击几率",
    g: 10,
    f: 19
},
Wk = {
    c: "additionalAttackPercentNinja4",
    title: "额外攻击几率",
    e: "+10%额外攻击几率",
    g: 10,
    f: 19
},
Xk = {
    c: "swiftStrikeUpgradeNinja1",
    title: "快速打击 II",
    e: "额外受害者",
    g: 1,
    f: 28
},
Yk = {
    c: "swiftStrikeUpgradeNinja2",
    title: "快速打击 III",
    e: "额外受害者",
    g: 1,
    f: 28
};
var Zk = {
    c: "improvedDamagePriest1",
    title: "伤害提高 I",
    e: "10%伤害加成",
    g: 10,
    f: 2
},
$k = {
    c: "improvedDamagePriest2",
    title: "伤害提高 II",
    e: "10%伤害加成",
    g: 10,
    f: 2
},
al = {
    c: "improvedDamagePriest3",
    title: "伤害提高 III",
    e: "10%伤害加成",
    g: 10,
    f: 2
},
bl = {
    c: "improvedArmorPriest1",
    title: "护甲提高 I",
    e: "10%护甲加成",
    g: 10,
    f: 3
},
cl = {
    c: "improvedArmorPriest2",
    title: "护甲提高 II",
    e: "10%护甲加成",
    g: 10,
    f: 3
},
dl = {
    c: "improvedArmorPriest3",
    title: "护甲提高 III",
    e: "10%护甲加成",
    g: 10,
    f: 3
},
el = {
    c: "improvedAttackRatingPriest1",
    title: "攻击等级提高 I",
    e: "10%攻击等级加成",
    g: 10,
    f: 4
},
fl = {
    c: "improvedAttackRatingPriest2",
    title: "攻击等级提高 II",
    e: "10%攻击等级加成",
    g: 10,
    f: 4
},
gl = {
    c: "improvedAttackRatingPriest3",
    title: "攻击等级提高 III",
    e: "10%攻击等级加成",
    g: 10,
    f: 4
},
hl = {
    c: "improvedDefenseRatingPriest1",
    title: "防御等级提高 I",
    e: "10%防御等级加成",
    g: 10,
    f: 5
},
il = {
    c: "improvedDefenseRatingPriest2",
    title: "防御等级提高 II",
    e: "10%防御等级加成",
    g: 10,
    f: 5
},
jl = {
    c: "improvedDefenseRatingPriest3",
    title: "防御等级提高 III",
    e: "10%防御等级加成",
    g: 10,
    f: 5
},
kl = {
    c: "healthRegenerationPriest1",
    title: "快速生命回复 I",
    e: "生命回复速率+1%",
    g: 1,
    f: 8
},
ll = {
    c: "healthRegenerationPriest2",
    title: "快速生命回复 II",
    e: "生命回复速率+1%",
    g: 1,
    f: 8
},
ml = {
    c: "spiritRegenerationPriest1",
    title: "快速法力回复 I",
    e: "法力回复速率+1%",
    g: 1,
    f: 9
},
nl = {
    c: "spiritRegenerationPriest2",
    title: "快速法力回复 II",
    e: "法力回复速率+1",
    g: 1,
    f: 9
},
ol = {
    c: "improvedHealthPriest1",
    title: "生命提高 I",
    e: "最大生命+20%",
    g: 20,
    f: 6
},
pl = {
    c: "improvedHealthPriest2",
    title: "生命提高 II",
    e: "最大生命+20%",
    g: 20,
    f: 6
},
ql = {
    c: "improvedSpiritPriest1",
    title: "法力提高 I",
    e: "最大法力+20%",
    g: 20,
    f: 7
},
Bl = {
    c: "improvedSpiritPriest2",
    title: "法力提高 II",
    e: "最大法力+20%",
    g: 20,
    f: 7
},
Cl = {
    c: "spellCostPriest1",
    title: "高效施法者 I",
    e: "技能消耗法力降低10%",
    g: 10,
    f: 16
},
Dl = {
    c: "spellCostPriest2",
    title: "高效施法者 II",
    e: "技能消耗法力降低10%",
    g: 10,
    f: 16
},
El = {
    c: "fasterAttacksPriest1",
    title: "快速攻击 I",
    e: "攻击冷却时间减少",
    g: 2,
    f: 10
},
Fl = {
    c: "ignoreDamagePriest1",
    title: "伤害抵抗",
    e: "免疫10%敌人的伤害",
    g: 10,
    f: 1
},
Gl = {
    c: "ignoreDamagePriest2",
    title: "伤害抵抗",
    e: "免疫10%敌人的伤害",
    g: 10,
    f: 1
},
Hl = {
    c: "improvedHealingSpellPriest",
    title: "治疗提高法术",
    e: "治疗法术效果翻倍",
    g: 2,
    f: 11
},
Il = {
    c: "improvedDamageSpellPriest",
    title: "伤害提高法术",
    e: "伤害法术加成x2",
    g: 2,
    f: 12
},
Jl = {
    c: "improvedArmorSpellPriest",
    title: "护甲提高法术",
    e: "护甲法术加成x2",
    g: 2,
    f: 13
},
Kl = {
    c: "improvedAttackRatingSpellPriest",
    title: "攻击等级提高法术",
    e: "攻击等级加成x2",
    g: 2,
    f: 14
},
Ll = {
    c: "improvedDefenseRatingSpellPriest",
    title: "防御等级提高法术",
    e: "防御等级加成x2",
    g: 2,
    f: 15
};
var Ml = {
    c: "improvedDamageMageElectric1",
    title: "伤害提高 I",
    e: "10%伤害加成",
    g: 10,
    f: 2
},
Nl = {
    c: "improvedDamageMageElectric2",
    title: "伤害提高 II",
    e: "10%伤害加成",
    g: 10,
    f: 2
},
Ol = {
    c: "improvedDamageMageElectric3",
    title: "伤害提高 III",
    e: "10%伤害加成",
    g: 10,
    f: 2
},
Pl = {
    c: "improvedArmorMageElectric1",
    title: "护甲提高 I",
    e: "10%护甲加成",
    g: 10,
    f: 3
},
Ql = {
    c: "improvedArmorMageElectric2",
    title: "护甲提高 II",
    e: "10%护甲加成",
    g: 10,
    f: 3
},
Rl = {
    c: "improvedArmorMageElectric3",
    title: "护甲提高 III",
    e: "10%护甲加成",
    g: 10,
    f: 3
},
Sl = {
    c: "improvedAttackRatingMageElectric1",
    title: "攻击等级提高 I",
    e: "10%攻击等级加成",
    g: 10,
    f: 4
},
Tl = {
    c: "improvedAttackRatingMageElectric2",
    title: "攻击等级提高 II",
    e: "10%攻击等级加成",
    g: 10,
    f: 4
},
Ul = {
    c: "improvedAttackRatingMageElectric3",
    title: "攻击等级提高 III",
    e: "10%攻击等级加成",
    g: 10,
    f: 4
},
Vl = {
    c: "improvedDefenseRatingMageElectric1",
    title: "防御等级提高 I",
    e: "10%防御等级加成",
    g: 10,
    f: 5
},
Wl = {
    c: "improvedDefenseRatingMageElectric2",
    title: "防御等级提高 II",
    e: "10%防御等级加成",
    g: 10,
    f: 5
},
Xl = {
    c: "improvedDefenseRatingMageElectric3",
    title: "防御等级提高 III",
    e: "10%防御等级加成",
    g: 10,
    f: 5
},
Yl = {
    c: "healthRegenerationMageElectric1",
    title: "快速生命回复 I",
    e: "生命回复速率+1%",
    g: 1,
    f: 8
},
Zl = {
    c: "healthRegenerationMageElectric2",
    title: "快速生命回复 II",
    e: "生命回复速率+1%",
    g: 1,
    f: 8
},
$l = {
    c: "spiritRegenerationMageElectric1",
    title: "快速法力回复 I",
    e: "法力回复速率+1%",
    g: 1,
    f: 9
},
am = {
    c: "spiritRegenerationMageElectric2",
    title: "快速法力回复 II",
    e: "法力回复速率+1%",
    g: 1,
    f: 9
},
bm = {
    c: "improvedHealthMageElectric1",
    title: "生命提高 I",
    e: "最大生命+20%",
    g: 20,
    f: 6
},
cm = {
    c: "improvedHealthMageElectric2",
    title: "生命提高 II",
    e: "最大生命+20%",
    g: 20,
    f: 6
},
dm = {
    c: "improvedSpiritMageElectric1",
    title: "法力提高 I",
    e: "最大法力+20%",
    g: 20,
    f: 7
},
em = {
    c: "improvedSpiritMageElectric2",
    title: "法力提高 II",
    e: "最大法力+20%",
    g: 20,
    f: 7
},
fm = {
    c: "spellCostMageElectric1",
    title: "高效施法者 I",
    e: "技能消耗法力降低10%",
    g: 10,
    f: 16
},
gm = {
    c: "spellCostMageElectric2",
    title: "高效施法者 II",
    e: "技能消耗法力降低10%",
    g: 10,
    f: 16
},
hm = {
    c: "fasterAttacksMageElectric1",
    title: "快速攻击 I",
    e: "攻击冷却时间减少",
    g: 2,
    f: 10
},
im = {
    c: "fasterAttacksMageElectric2",
    title: "快速攻击 II",
    e: "攻击冷却时间减少",
    g: 2,
    f: 10
},
jm = {
    c: "improvedSpiderWebMageElectric1",
    title: "蛛网提高 I",
    e: "捕捉更多敌人",
    g: 1,
    f: 20
},
km = {
    c: "improvedSpiderWebMageElectric2",
    title: "蛛网提高 II",
    e: "捕捉更多敌人",
    g: 2,
    f: 20
},
lm = {
    c: "improvedSpiderWebMageElectric3",
    title: "蛛网提高 III",
    e: "捕捉更多敌人",
    g: 2,
    f: 20
},
mm = {
    c: "improvedChainLightningMageElectric1",
    title: "链形闪电提高 I",
    e: "闪电弧+2",
    g: 2,
    f: 21
},
nm = {
    c: "improvedChainLightningMageElectric2",
    title: "链形闪电提高 II",
    e: "闪电弧+2",
    g: 2,
    f: 21
},
om = {
    c: "improvedChainLightningMageElectric3",
    title: "链形闪电提高 III",
    e: "闪电弧+2",
    g: 2,
    f: 21
},
pm = {
    c: "improvedLightningRainMageElectric1",
    title: "闪电雨提高 I",
    e: "法术面积扩大.",
    g: 1,
    f: 22
},
qm = {
    c: "improvedLightningRainMageElectric2",
    title: "闪电雨提高 II",
    e: "法术面积扩大.",
    g: 1,
    f: 22
};
var rm = {
    c: "improvedDamageMageFire1",
    title: "伤害提高 I",
    e: "10%伤害加成",
    g: 10,
    f: 2
},
sm = {
    c: "improvedDamageMageFire2",
    title: "伤害提高 II",
    e: "10%伤害加成",
    g: 10,
    f: 2
},
tm = {
    c: "improvedDamageMageFire3",
    title: "伤害提高 III",
    e: "10%伤害加成",
    g: 10,
    f: 2
},
um = {
    c: "improvedArmorMageFire1",
    title: "护甲提高 I",
    e: "10%护甲加成",
    g: 10,
    f: 3
},
vm = {
    c: "improvedArmorMageFire2",
    title: "护甲提高 II",
    e: "10%护甲加成",
    g: 10,
    f: 3
},
wm = {
    c: "improvedArmorMageFire3",
    title: "护甲提高 III",
    e: "10%护甲加成",
    g: 10,
    f: 3
},
xm = {
    c: "improvedAttackRatingMageFire1",
    title: "攻击等级提高 I",
    e: "10%攻击等级加成",
    g: 10,
    f: 4
},
ym = {
    c: "improvedAttackRatingMageFire2",
    title: "攻击等级提高 II",
    e: "10%攻击等级加成",
    g: 10,
    f: 4
},
zm = {
    c: "improvedAttackRatingMageFire3",
    title: "攻击等级提高 III",
    e: "10%攻击等级加成",
    g: 10,
    f: 4
},
Am = {
    c: "improvedDefenseRatingMageFire1",
    title: "防御等级提高 I",
    e: "10%防御等级加成",
    g: 10,
    f: 5
},
Bm = {
    c: "improvedDefenseRatingMageFire2",
    title: "防御等级提高 II",
    e: "10%防御等级加成",
    g: 10,
    f: 5
},
Cm = {
    c: "improvedDefenseRatingMageFire3",
    title: "防御等级提高 III",
    e: "10%防御等级加成",
    g: 10,
    f: 5
},
Dm = {
    c: "healthRegenerationMageFire1",
    title: "快速生命回复 I",
    e: "生命回复速率+1%",
    g: 1,
    f: 8
},
Em = {
    c: "healthRegenerationMageFire2",
    title: "快速生命回复 II",
    e: "生命回复速率+1%",
    g: 1,
    f: 8
},
Fm = {
    c: "spiritRegenerationMageFire1",
    title: "快速法力回复 I",
    e: "法力回复速率+1%",
    g: 1,
    f: 9
},
Gm = {
    c: "spiritRegenerationMageFire2",
    title: "快速法力回复 II",
    e: "法力回复速率+1%",
    g: 1,
    f: 9
},
Hm = {
    c: "improvedHealthMageFire1",
    title: "生命提高 I",
    e: "最大生命+20%",
    g: 20,
    f: 6
},
Im = {
    c: "improvedHealthMageFire2",
    title: "生命提高 II",
    e: "最大生命+20%",
    g: 20,
    f: 6
},
Jm = {
    c: "improvedSpiritMageFire1",
    title: "法力提高 I",
    e: "最大法力+20%",
    g: 20,
    f: 7
},
Km = {
    c: "improvedSpiritMageFire2",
    title: "法力提高 II",
    e: "最大法力+20%",
    g: 20,
    f: 7
},
Lm = {
    c: "spellCostMageFire1",
    title: "高效施法者 I",
    e: "技能消耗法力降低10%",
    g: 10,
    f: 16
},
Mm = {
    c: "spellCostMageFire2",
    title: "高效施法者 II",
    e: "技能消耗法力降低10%",
    g: 10,
    f: 16
},
Nm = {
    c: "fasterAttacksMageFire1",
    title: "快速攻击 I",
    e: "攻击冷却时间减少",
    g: 2,
    f: 10
},
Om = {
    c: "fasterAttacksMageFire2",
    title: "快速攻击 II",
    e: "攻击冷却时间减少",
    g: 2,
    f: 10
},
Pm = {
    c: "improvedTurnMonsters1",
    title: "转变怪物提高 I",
    e: "转变更多怪物",
    g: 1,
    f: 27
},
Qm = {
    c: "improvedTurnMonsters2",
    title: "转变怪物提高 II",
    e: "转变更多怪物",
    g: 2,
    f: 27
},
Rm = {
    c: "improvedTurnMonsters3",
    title: "转变怪物提高 III",
    e: "转变更多怪物",
    g: 2,
    f: 27
},
Sm = {
    c: "improvedFireRainMageFire1",
    title: "火雨提高 I",
    e: "法术面积扩大.",
    g: 1,
    f: 22
},
Tm = {
    c: "improvedFireRainMageFire2",
    title: "火雨提高 II",
    e: "法术面积扩大.",
    g: 1,
    f: 22
},
Um = {
    c: "improvedFireballMageFire1",
    title: "火球提高 I",
    e: "大爆炸.",
    g: 1,
    f: 25
},
Vm = {
    c: "improvedFireballMageFire2",
    title: "火球提高 II",
    e: "大爆炸.",
    g: 1,
    f: 25
};
var Wm = {
    c: "improvedDamageRanger1",
    title: "伤害提高 I",
    e: "10%伤害加成",
    g: 10,
    f: 2
},
Xm = {
    c: "improvedDamageRanger2",
    title: "伤害提高 II",
    e: "10%伤害加成",
    g: 10,
    f: 2
},
Ym = {
    c: "improvedDamageRanger3",
    title: "伤害提高 III",
    e: "10%伤害加成",
    g: 10,
    f: 2
},
Zm = {
    c: "improvedArmorRanger1",
    title: "护甲提高 I",
    e: "10%护甲加成",
    g: 10,
    f: 3
},
$m = {
    c: "improvedArmorRanger2",
    title: "护甲提高 II",
    e: "10%护甲加成",
    g: 10,
    f: 3
},
an = {
    c: "improvedArmorRanger3",
    title: "护甲提高 III",
    e: "10%护甲加成",
    g: 10,
    f: 3
},
bn = {
    c: "improvedAttackRatingRanger1",
    title: "攻击等级提高 I",
    e: "10%攻击等级加成",
    g: 10,
    f: 4
},
cn = {
    c: "improvedAttackRatingRanger2",
    title: "攻击等级提高 II",
    e: "10%攻击等级加成",
    g: 10,
    f: 4
},
dn = {
    c: "improvedAttackRatingRanger3",
    title: "攻击等级提高 III",
    e: "10%攻击等级加成",
    g: 10,
    f: 4
},
en = {
    c: "improvedDefenseRatingRanger1",
    title: "防御等级提高 I",
    e: "10%防御等级加成",
    g: 10,
    f: 5
},
fn = {
    c: "improvedDefenseRatingRanger2",
    title: "防御等级提高 II",
    e: "10%防御等级加成",
    g: 10,
    f: 5
},
gn = {
    c: "improvedDefenseRatingRanger3",
    title: "防御等级提高 III",
    e: "10%防御等级加成",
    g: 10,
    f: 5
},
hn = {
    c: "criticalHitChanceRanger1",
    title: "致命一击",
    e: "暴击几率+5%",
    g: 5,
    f: 17
},
jn = {
    c: "criticalHitChanceRanger2",
    title: "致命一击s",
    e: "暴击几率+5%",
    g: 5,
    f: 17
},
kn = {
    c: "criticalHitChanceRanger3",
    title: "更多致命一击",
    e: "暴击几率+5%",
    g: 5,
    f: 17
},
ln = {
    c: "criticalHitChanceRanger4",
    title: "更多致命一击",
    e: "暴击几率+5%",
    g: 5,
    f: 17
},
mn = {
    c: "healthRegenerationRanger1",
    title: "快速生命回复 I",
    e: "生命回复速率+1%",
    g: 1,
    f: 8
},
nn = {
    c: "healthRegenerationRanger2",
    title: "快速生命回复 II",
    e: "生命回复速率+1%",
    g: 1,
    f: 8
},
on = {
    c: "healthRegenerationRanger3",
    title: "快速生命回复 III",
    e: "生命回复速率+1%",
    g: 1,
    f: 8
},
pn = {
    c: "improvedHealthRanger1",
    title: "生命提高 I",
    e: "最大生命+20%",
    g: 20,
    f: 6
},
qn = {
    c: "improvedHealthRanger2",
    title: "生命提高 II",
    e: "最大生命+20%",
    g: 20,
    f: 6
},
rn = {
    c: "improvedHealthRanger3",
    title: "生命提高 III",
    e: "最大生命+20%",
    g: 20,
    f: 6
},
sn = {
    c: "fasterAttacksRanger1",
    title: "快速射击",
    e: "攻击冷却时间减少",
    g: 2,
    f: 10
},
tn = {
    c: "fasterAttacksRanger2",
    title: "高速射击",
    e: "攻击冷却时间减少",
    g: 2,
    f: 10
},
un = {
    c: "fasterAttacksRanger3",
    title: "飞速射击",
    e: "攻击冷却时间减少",
    g: 2,
    f: 10
},
vn = {
    c: "ricochetCountRanger1",
    title: "跳弹射击",
    e: "最大可能弹跳次数+1",
    g: 1,
    f: 23
},
wn = {
    c: "ricochetCountRanger2",
    title: "跳弹射击",
    e: "最大可能弹跳次数+1",
    g: 1,
    f: 23
},
xn = {
    c: "ricochetCountRanger3",
    title: "跳弹射击",
    e: "最大可能弹跳次数+1",
    g: 1,
    f: 23
},
yn = {
    c: "ricochetCountRanger4",
    title: "跳弹射击",
    e: "最大可能弹跳次数+1",
    g: 1,
    f: 23
},
zn = {
    c: "ricochetPercentRanger1",
    title: "弹跳几率",
    e: "弹跳几率+15%",
    g: 15,
    f: 24
},
An = {
    c: "ricochetPercentRanger2",
    title: "弹跳几率",
    e: "弹跳几率+15%",
    g: 15,
    f: 24
},
Bn = {
    c: "ricochetPercentRanger3",
    title: "弹跳几率",
    e: "弹跳几率+15%",
    g: 15,
    f: 24
},
Cn = {
    c: "ricochetPercentRanger4",
    title: "弹跳几率",
    e: "弹跳几率+15%",
    g: 15,
    f: 24
};
var Dn = {
    c: "improvedDamageRogue1",
    title: "伤害提高 I",
    e: "10%伤害加成",
    g: 10,
    f: 2
},
En = {
    c: "improvedDamageRogue2",
    title: "伤害提高 II",
    e: "10%伤害加成",
    g: 10,
    f: 2
},
Fn = {
    c: "improvedDamageRogue3",
    title: "伤害提高 III",
    e: "10%伤害加成",
    g: 10,
    f: 2
},
Gn = {
    c: "improvedArmorRogue1",
    title: "护甲提高 I",
    e: "10%护甲加成",
    g: 10,
    f: 3
},
Hn = {
    c: "improvedArmorRogue2",
    title: "护甲提高 II",
    e: "10%护甲加成",
    g: 10,
    f: 3
},
In = {
    c: "improvedArmorRogue3",
    title: "护甲提高 III",
    e: "10%护甲加成",
    g: 10,
    f: 3
},
Jn = {
    c: "improvedAttackRatingRogue1",
    title: "攻击等级提高 I",
    e: "10%攻击等级加成",
    g: 10,
    f: 4
},
Kn = {
    c: "improvedAttackRatingRogue2",
    title: "攻击等级提高 II",
    e: "10%攻击等级加成",
    g: 10,
    f: 4
},
Ln = {
    c: "improvedAttackRatingRogue3",
    title: "攻击等级提高 III",
    e: "10%攻击等级加成",
    g: 10,
    f: 4
},
Mn = {
    c: "improvedDefenseRatingRogue1",
    title: "防御等级提高 I",
    e: "10%防御等级加成",
    g: 10,
    f: 5
},
Nn = {
    c: "improvedDefenseRatingRogue2",
    title: "防御等级提高 II",
    e: "10%防御等级加成",
    g: 10,
    f: 5
},
On = {
    c: "improvedDefenseRatingRogue3",
    title: "防御等级提高 III",
    e: "10%防御等级加成",
    g: 10,
    f: 5
},
Pn = {
    c: "fasterAttacksRogue1",
    title: "快速攻击 I",
    e: "攻击冷却时间减少",
    g: 2,
    f: 10
},
Qn = {
    c: "fasterAttacksRogue2",
    title: "快速攻击 II",
    e: "攻击冷却时间减少",
    g: 2,
    f: 10
},
Rn = {
    c: "fasterAttacksRogue3",
    title: "快速攻击 III",
    e: "攻击冷却时间减少",
    g: 2,
    f: 10
},
Sn = {
    c: "healthRegenerationRogue1",
    title: "快速生命回复 I",
    e: "生命回复速率+1%",
    g: 1,
    f: 8
},
Tn = {
    c: "healthRegenerationRogue2",
    title: "快速生命回复 II",
    e: "生命回复速率+1%",
    g: 1,
    f: 8
},
Un = {
    c: "healthRegenerationRogue3",
    title: "快速生命回复 III",
    e: "生命回复速率+1%",
    g: 1,
    f: 8
},
Vn = {
    c: "spiritRegenerationRogue1",
    title: "快速法力回复 I",
    e: "法力回复速率+1%",
    g: 1,
    f: 9
},
Wn = {
    c: "spiritRegenerationRogue2",
    title: "快速法力回复 II",
    e: "法力回复速率+1%",
    g: 1,
    f: 9
},
Xn = {
    c: "improvedHealthRogue1",
    title: "生命提高 I",
    e: "最大生命+20%",
    g: 20,
    f: 6
},
Yn = {
    c: "improvedHealthRogue2",
    title: "生命提高 II",
    e: "最大生命+20%",
    g: 20,
    f: 6
},
Zn = {
    c: "improvedHealthRogue3",
    title: "生命提高 III",
    e: "最大生命+20%",
    g: 20,
    f: 6
},
$n = {
    c: "improvedSpiritRogue1",
    title: "法力提高 I",
    e: "最大法力+20%",
    g: 20,
    f: 7
},
ao = {
    c: "criticalHitChanceRogue1",
    title: "暴击几率",
    e: "暴击几率+5%",
    g: 5,
    f: 17
},
bo = {
    c: "criticalHitChanceRogue2",
    title: "暴击几率",
    e: "暴击几率+5%",
    g: 5,
    f: 17
},
co = {
    c: "criticalHitChanceRogue3",
    title: "暴击几率",
    e: "暴击几率+5%",
    g: 5,
    f: 17
},
eo = {
    c: "attacksPerTurnRogue1",
    title: "额外打击",
    e: "每回合最大攻击次数+1",
    g: 1,
    f: 18
},
fo = {
    c: "attacksPerTurnRogue1",
    title: "再次攻击",
    e: "每回合最大攻击次数+1",
    g: 1,
    f: 18
},
go = {
    c: "additionalAttackPercentRogue1",
    title: "额外攻击几率",
    e: "+10%额外攻击几率",
    g: 10,
    f: 19
},
ho = {
    c: "additionalAttackPercentRogue2",
    title: "额外攻击几率",
    e: "+10%额外攻击几率",
    g: 10,
    f: 19
},
io = {
    c: "additionalAttackPercentRogue3",
    title: "额外攻击几率",
    e: "+10%额外攻击几率",
    g: 10,
    f: 19
},
jo = {
    c: "additionalAttackPercentRogue4",
    title: "额外攻击几率",
    e: "+10%额外攻击几率",
    g: 10,
    f: 19
};
var ko = {
    c: "improvedDamageNecromancer1",
    title: "伤害+10%",
    e: "宠物和召唤者加成",
    g: 10,
    f: 2
},
lo = {
    c: "improvedDamageNecromancer2",
    title: "伤害+10%",
    e: "宠物和召唤者加成",
    g: 10,
    f: 2
},
mo = {
    c: "improvedDamageNecromancer3",
    title: "伤害+10%",
    e: "宠物和召唤者加成",
    g: 10,
    f: 2
},
no = {
    c: "improvedArmorNecromancer1",
    title: "护甲+10%",
    e: "宠物和召唤者加成",
    g: 10,
    f: 3
},
oo = {
    c: "improvedArmorNecromancer2",
    title: "护甲+10%",
    e: "宠物和召唤者加成",
    g: 10,
    f: 3
},
po = {
    c: "improvedArmorNecromancer3",
    title: "护甲+10%",
    e: "宠物和召唤者加成",
    g: 10,
    f: 3
},
qo = {
    c: "improvedAttackRatingNecromancer1",
    title: "攻击等级+10%",
    e: "宠物和召唤者加成",
    g: 10,
    f: 4
},
ro = {
    c: "improvedAttackRatingNecromancer2",
    title: "攻击等级+10%",
    e: "宠物和召唤者加成",
    g: 10,
    f: 4
},
so = {
    c: "improvedAttackRatingNecromancer3",
    title: "攻击等级+10%",
    e: "宠物和召唤者加成",
    g: 10,
    f: 4
},
to = {
    c: "improvedDefenseRatingNecromancer1",
    title: "防御等级+10%",
    e: "宠物和召唤者加成",
    g: 10,
    f: 5
},
uo = {
    c: "improvedDefenseRatingNecromancer2",
    title: "防御等级+10%",
    e: "宠物和召唤者加成",
    g: 10,
    f: 5
},
vo = {
    c: "improvedDefenseRatingNecromancer3",
    title: "防御等级+10%",
    e: "宠物和召唤者加成",
    g: 10,
    f: 5
},
wo = {
    c: "healthRegenerationNecromancer1",
    title: "生命回复等级+1%",
    e: "宠物和召唤者加成",
    g: 1,
    f: 8
},
xo = {
    c: "healthRegenerationNecromancer2",
    title: "生命回复等级+1%",
    e: "宠物和召唤者加成",
    g: 1,
    f: 8
},
yo = {
    c: "spiritRegenerationNecromancer1",
    title: "法力回复速率+1%",
    e: "宠物和召唤者加成",
    g: 1,
    f: 9
},
zo = {
    c: "spiritRegenerationNecromancer2",
    title: "法力回复速率+1%",
    e: "宠物和召唤者加成",
    g: 1,
    f: 9
},
Ao = {
    c: "improvedHealthNecromancer1",
    title: "最大生命+20%",
    e: "宠物和召唤者加成",
    g: 20,
    f: 6
},
Bo = {
    c: "improvedHealthNecromancer2",
    title: "最大生命+20%",
    e: "宠物和召唤者加成",
    g: 20,
    f: 6
},
Co = {
    c: "improvedHealthNecromancer3",
    title: "生命提高+20%",
    e: "宠物和召唤者加成",
    g: 20,
    f: 6
},
Do = {
    c: "improvedSpiritNecromancer1",
    title: "最大法力+20%",
    e: "宠物和召唤者加成",
    g: 20,
    f: 7
},
Eo = {
    c: "improvedSpiritNecromancer2",
    title: "最大法力+20%",
    e: "宠物和召唤者加成",
    g: 20,
    f: 7
},
Fo = {
    c: "spellCostNecromancer1",
    title: "最大法力+20%",
    e: "宠物和召唤者加成",
    g: 10,
    f: 16
},
Go = {
    c: "spellCostNecromancer2",
    title: "最大法力+20%",
    e: "宠物和召唤者加成",
    g: 10,
    f: 16
},
Ho = {
    c: "fasterAttacksNecromancer1",
    title: "攻击冷却时间减少",
    e: "宠物和召唤者加成",
    g: 2,
    f: 10
},
Io = {
    c: "fasterAttacksNecromancer2",
    title: "攻击冷却时间减少",
    e: "宠物和召唤者加成",
    g: 2,
    f: 10
},
Jo = {
    c: "largerSkeletonArmyNecromancer1",
    title: "更多骷髅",
    e: "更多死亡,更多屠杀",
    g: 1,
    f: 26
},
Ko = {
    c: "largerSkeletonArmyNecromancer2",
    title: "更多骷髅",
    e: "更多死亡,更多屠杀",
    g: 1,
    f: 26
},
Lo = {
    c: "largerSkeletonArmyNecromancer3",
    title: "更多骷髅",
    e: "更多死亡,更多屠杀",
    g: 1,
    f: 26
},
Mo = {
    c: "greenDeathRicochetCountNecromancer1",
    title: "绿色死亡 II",
    e: "更多绿色死亡",
    g: 1,
    f: 29
},
No = {
    c: "greenDeathRicochetCountNecromancer2",
    title: "绿色死亡 III",
    e: "更多绿色死亡",
    g: 1,
    f: 29
},
Oo = {
    c: "greenDeathRicochetCountNecromancer3",
    title: "绿色死亡 IV",
    e: "更多绿色死亡",
    g: 1,
    f: 29
};
var Po = {
    c: "improvedDamageDruid1",
    title: "伤害+10%",
    e: "宠物加成",
    g: 10,
    f: 2
},
Qo = {
    c: "improvedDamageDruid2",
    title: "伤害+10%",
    e: "宠物加成",
    g: 10,
    f: 2
},
Ro = {
    c: "improvedDamageDruid3",
    title: "伤害+10%",
    e: "宠物加成",
    g: 10,
    f: 2
},
So = {
    c: "improvedArmorDruid1",
    title: "护甲+10%",
    e: "宠物和召唤者加成",
    g: 10,
    f: 3
},
To = {
    c: "improvedArmorDruid2",
    title: "护甲+10%",
    e: "宠物和召唤者加成",
    g: 10,
    f: 3
},
Uo = {
    c: "improvedArmorDruid3",
    title: "护甲+10%",
    e: "宠物和召唤者加成",
    g: 10,
    f: 3
},
Vo = {
    c: "improvedAttackRatingDruid1",
    title: "攻击等级+10%",
    e: "宠物加成",
    g: 10,
    f: 4
},
Wo = {
    c: "improvedAttackRatingDruid2",
    title: "攻击等级+10%",
    e: "宠物加成",
    g: 10,
    f: 4
},
Xo = {
    c: "improvedAttackRatingDruid3",
    title: "攻击等级+10%",
    e: "宠物加成",
    g: 10,
    f: 4
},
Yo = {
    c: "improvedDefenseRatingDruid1",
    title: "防御等级+10%",
    e: "宠物和召唤者加成",
    g: 10,
    f: 5
},
Zo = {
    c: "improvedDefenseRatingDruid2",
    title: "防御等级+10%",
    e: "宠物和召唤者加成",
    g: 10,
    f: 5
},
$o = {
    c: "improvedDefenseRatingDruid3",
    title: "防御等级+10%",
    e: "宠物和召唤者加成",
    g: 10,
    f: 5
},
ap = {
    c: "healthRegenerationDruid1",
    title: "生命回复等级+1%",
    e: "宠物和召唤者加成",
    g: 1,
    f: 8
},
bp = {
    c: "healthRegenerationDruid2",
    title: "生命回复等级+1%",
    e: "宠物和召唤者加成",
    g: 1,
    f: 8
},
cp = {
    c: "spiritRegenerationDruid1",
    title: "法力回复速率+1%",
    e: "宠物和召唤者加成",
    g: 1,
    f: 9
},
dp = {
    c: "spiritRegenerationDruid2",
    title: "法力回复速率+1%",
    e: "宠物和召唤者加成",
    g: 1,
    f: 9
},
ep = {
    c: "improvedHealthDruid1",
    title: "最大生命+20%",
    e: "宠物和召唤者加成",
    g: 20,
    f: 6
},
fp = {
    c: "improvedHealthDruid2",
    title: "最大生命+20%",
    e: "宠物和召唤者加成",
    g: 20,
    f: 6
},
gp = {
    c: "improvedSpiritDruid1",
    title: "最大法力+20%",
    e: "宠物和召唤者加成",
    g: 20,
    f: 7
},
hp = {
    c: "improvedSpiritDruid2",
    title: "最大法力+20%",
    e: "宠物和召唤者加成",
    g: 20,
    f: 7
},
ip = {
    c: "spellCostDruid1",
    title: "技能消耗法力降低10%",
    e: "宠物和召唤者加成",
    g: 10,
    f: 16
},
jp = {
    c: "spellCostDruid2",
    title: "技能消耗法力降低10%",
    e: "宠物和召唤者加成",
    g: 10,
    f: 16
},
kp = {
    c: "fasterAttacksDruid1",
    title: "攻击冷却时间减少",
    e: "宠物和召唤者加成",
    g: 2,
    f: 10
},
lp = {
    c: "fasterAttacksDruid2",
    title: "攻击冷却时间减少",
    e: "宠物和召唤者加成",
    g: 2,
    f: 10
},
mp = {
    c: "largerWolfPackDruid1",
    title: "大型狼群",
    e: "更多野狼,更多杀戮",
    g: 1,
    f: 26
},
np = {
    c: "largerWolfPackDruid2",
    title: "大型狼群",
    e: "更多野狼,更多杀戮",
    g: 1,
    f: 26
},
op = {
    c: "largerWolfPackDruid3",
    title: "大型狼群",
    e: "更多野狼,更多杀戮",
    g: 1,
    f: 26
},
pp = {
    c: "largerWolfPackDruid4",
    title: "大型狼群",
    e: "更多野狼,更多杀戮",
    g: 1,
    f: 26
},
qp = {
    c: "largerWolfPackDruid5",
    title: "大型狼群",
    e: "更多野狼,更多杀戮",
    g: 1,
    f: 26
},
rp = {
    c: "improvedSleepDruid1",
    title: "睡眠提高 I",
    e: "更多怪物陷入睡眠",
    g: 1,
    f: 20
},
sp = {
    c: "improvedSleepDruid2",
    title: "睡眠提高 II",
    e: "更多怪物陷入睡眠",
    g: 2,
    f: 20
},
tp = {
    c: "improvedSleepDruid3",
    title: "睡眠提高 III",
    e: "更多怪物陷入睡眠",
    g: 2,
    f: 20
};
var up = {
    c: "improvedDamageChickenKing1",
    title: "伤害+10%",
    e: "宠物加成",
    g: 10,
    f: 2
},
vp = {
    c: "improvedDamageChickenKing2",
    title: "伤害+10%",
    e: "宠物加成",
    g: 10,
    f: 2
},
wp = {
    c: "improvedDamageChickenKing3",
    title: "伤害+10%",
    e: "宠物加成",
    g: 10,
    f: 2
},
xp = {
    c: "improvedArmorChickenKing1",
    title: "护甲+10%",
    e: "宠物和召唤者加成",
    g: 10,
    f: 3
},
yp = {
    c: "improvedArmorChickenKing2",
    title: "护甲+10%",
    e: "宠物和召唤者加成",
    g: 10,
    f: 3
},
zp = {
    c: "improvedArmorChickenKing3",
    title: "护甲+10%",
    e: "宠物和召唤者加成",
    g: 10,
    f: 3
},
Ap = {
    c: "improvedAttackRatingChickenKing1",
    title: "攻击等级+10%",
    e: "宠物加成",
    g: 10,
    f: 4
},
Bp = {
    c: "improvedAttackRatingChickenKing2",
    title: "攻击等级+10%",
    e: "宠物加成",
    g: 10,
    f: 4
},
Cp = {
    c: "improvedAttackRatingChickenKing3",
    title: "攻击等级+10%",
    e: "宠物加成",
    g: 10,
    f: 4
},
Dp = {
    c: "improvedDefenseRatingChickenKing1",
    title: "防御等级+10%",
    e: "宠物和召唤者加成",
    g: 10,
    f: 5
},
Ep = {
    c: "improvedDefenseRatingChickenKing2",
    title: "防御等级+10%",
    e: "宠物和召唤者加成",
    g: 10,
    f: 5
},
Fp = {
    c: "improvedDefenseRatingChickenKing3",
    title: "防御等级+10%",
    e: "宠物和召唤者加成",
    g: 10,
    f: 5
},
Gp = {
    c: "healthRegenerationChickenKing1",
    title: "生命回复等级+1%",
    e: "宠物和召唤者加成",
    g: 1,
    f: 8
},
Hp = {
    c: "healthRegenerationChickenKing2",
    title: "生命回复等级+1%",
    e: "宠物和召唤者加成",
    g: 1,
    f: 8
},
Ip = {
    c: "spiritRegenerationChickenKing1",
    title: "法力回复速率+1%",
    e: "宠物和召唤者加成",
    g: 1,
    f: 9
},
Jp = {
    c: "spiritRegenerationChickenKing2",
    title: "法力回复速率+1%",
    e: "宠物和召唤者加成",
    g: 1,
    f: 9
},
Kp = {
    c: "improvedHealthChickenKing1",
    title: "最大生命+20%",
    e: "宠物和召唤者加成",
    g: 20,
    f: 6
},
Lp = {
    c: "improvedHealthChickenKing2",
    title: "最大生命+20%",
    e: "宠物和召唤者加成",
    g: 20,
    f: 6
},
Mp = {
    c: "improvedSpiritChickenKing1",
    title: "最大法力+20%",
    e: "宠物和召唤者加成",
    g: 20,
    f: 7
},
Wp = {
    c: "improvedSpiritChickenKing2",
    title: "最大法力+20%",
    e: "宠物和召唤者加成",
    g: 20,
    f: 7
},
Xp = {
    c: "spellCostChickenKing1",
    title: "技能消耗法力降低10%",
    e: "宠物和召唤者加成",
    g: 10,
    f: 16
},
Yp = {
    c: "spellCostChickenKing2",
    title: "技能消耗法力降低10%",
    e: "宠物和召唤者加成",
    g: 10,
    f: 16
},
Zp = {
    c: "fasterAttacksChickenKing1",
    title: "攻击冷却时间减少",
    e: "宠物和召唤者加成",
    g: 2,
    f: 10
},
$p = {
    c: "fasterAttacksChickenKing2",
    title: "攻击冷却时间减少",
    e: "宠物和召唤者加成",
    g: 2,
    f: 10
},
aq = {
    c: "largerFlockChickenKing1",
    title: "我爱小鸡!",
    e: "多一只鸡",
    g: 1,
    f: 26
},
bq = {
    c: "largerFlockChickenKing2",
    title: "小鸡军队",
    e: "多一只鸡",
    g: 1,
    f: 26
},
cq = {
    c: "largerFlockChickenKing3",
    title: "鸡瘟致死",
    e: "多一只鸡",
    g: 1,
    f: 26
},
dq = {
    c: "largerFlockChickenKing4",
    title: "小鸡派对",
    e: "多一只鸡",
    g: 1,
    f: 26
},
eq = {
    c: "largerFlockChickenKing5",
    title: "鸡群",
    e: "多一只鸡",
    g: 1,
    f: 26
},
fq = {
    c: "largerFlockChickenKing6",
    title: "家禽领地",
    e: "多一只鸡",
    g: 1,
    f: 26
},
gq = {
    c: "barbarianChanceChickenKing",
    title: "小鸡几率:野蛮人",
    e: "25%几率为野蛮人",
    g: 25,
    f: 30
},
hq = {
    c: "ninjaChanceChickenKing",
    title: "小鸡几率:忍者",
    e: "25%几率为忍者",
    g: 25,
    f: 31
},
iq = {
    c: "rogueChanceChickenKing",
    title: "小鸡几率:盗贼",
    e: "25%几率为盗贼",
    g: 25,
    f: 32
};
var jq = {
    ta: "Blast Stun",
    description: "Briefly Stuns Monsters",
    ca: "Bubbles",
    ya: null,
    X: 14,
    ga: 2,
    td: !0,
    Ra: 0,
    La: 15
};
var kq = {
    sB: {
        ta: "休克",
        description: "打击伤害",
        ca: "Gold Sparkles",
        ya: "Gold Sparkles",
        X: null,
        ga: 4,
        Ra: 0,
        La: 13,
        bo: !0
    },
    CB: {
        ta: "蛛网",
        description: "用网捕捉敌人",
        ca: "Spider Web",
        ya: "Web",
        X: 1,
        ga: 2,
        td: !0,
        Ra: 20,
        La: 20
    },
    XD: {
        ta: "闪电雨",
        description: "电雨带来死亡",
        ca: "Lightning Rain",
        ya: "Orange Star",
        X: null,
        ga: 6,
        Ra: 0,
        La: 30
    },
    br: {
        ta: "连锁闪电",
        description: "伤害多个敌人",
        ca: "Gold Sparkles",
        ya: null,
        X: null,
        ga: 5,
        Ra: 0,
        La: 25
    }
};
var lq = {
    rD: {
        ta: "火环",
        description: "火焰之环",
        ca: "Yellow Fire Ring",
        ya: "Yellow Star",
        X: null,
        ga: 4,
        Ra: 0,
        La: 13,
        bo: !0
    },
    Lz: {
        ta: "火雨",
        description: "轰轰烈烈的死亡.",
        ca: "Fire Rain",
        ya: "Yellow Star",
        X: null,
        ga: 6,
        Ra: 0,
        La: 40
    },
    Kz: {
        ta: "火球",
        description: "爆裂火焰",
        ca: "Orange Sparkles",
        ya: "Yellow Star",
        X: null,
        ga: 8,
        Ra: 0,
        La: 35
    },
    TE: {
        ta: "转变怪物",
        description: "怪物攻击怪物",
        ca: "Red Eye Blink",
        ya: "Pink Star",
        X: 4,
        ga: 2,
        td: !0,
        Ra: 0,
        La: 20
    }
};
var mq = {
    ta: "毒环",
    description: "剧毒的光环",
    ca: "Green Ring",
    ya: "Green Star",
    X: null,
    ga: 4,
    Ra: 10,
    La: 13,
    bo: !0
};
var nq = {
    yD: {
        ta: "治疗",
        description: "恢复35%生命",
        ca: "Red Crosses",
        ya: "Red Crosses",
        X: null,
        ga: 1,
        Ra: 35,
        La: 20
    },
    xE: {
        ta: "复活",
        description: "移除昏迷效果",
        ca: "White Crosses",
        ya: "White Crosses",
        X: null,
        ga: 16,
        Ra: 1,
        td: !0,
        La: 20
    },
    Zz: {
        ta: "提高护甲",
        description: "10%队伍护甲",
        ca: "Shields",
        ya: null,
        X: 5,
        ga: 3,
        Ra: 10,
        td: !0,
        La: 700
    },
    FD: {
        ta: "提高伤害",
        description: "10%队伍伤害",
        ca: "Arm Flex",
        ya: null,
        X: 6,
        ga: 3,
        Ra: 10,
        td: !0,
        La: 700
    },
    ED: {
        ta: "提高攻击等级",
        description: "10%队伍攻击等级",
        ca: "Eagle",
        ya: null,
        X: 7,
        ga: 3,
        Ra: 10,
        td: !0,
        La: 700
    },
    $z: {
        ta: "提高防御等级",
        description: "10%队伍防御等级",
        ca: "Armor",
        ya: null,
        X: 8,
        ga: 3,
        Ra: 10,
        td: !0,
        La: 700
    }
};
var oq = {
    ME: {
        ta: "嘲讽",
        description: "吸引怪物攻击战士",
        ca: "Target",
        ya: null,
        X: 10,
        ga: 2,
        td: !0,
        Ra: 50,
        La: 30
    }
};
var pq = {
    IB: {
        ta: "潜行",
        description: "潜行背刺",
        ca: "Color Spiral",
        ya: null,
        X: 11,
        ga: 2,
        td: !0,
        Ra: 100,
        La: 30
    },
    ID: {
        ta: "立即搜索",
        description: "快速搜索",
        ca: "Gold Sparkles",
        ya: null,
        X: null,
        ga: 14,
        td: !0,
        Ra: 0,
        La: 10
    },
    wu: {
        ta: "发现财宝箱",
        description: "自动搜索",
        ca: "Blue Sparkles",
        ya: null,
        X: null,
        ga: 15,
        td: !0,
        Ra: 0,
        La: 10
    }
};
var qq = {
    rE: {
        ta: "愤怒",
        description: "极大地提高伤害",
        ca: "Totems",
        ya: null,
        X: 12,
        ga: 2,
        td: !0,
        Ra: 100,
        La: 40
    },
    wB: {
        ta: "重锤",
        description: "溅射伤害+击退",
        ca: "Red Sparkles",
        ya: null,
        X: null,
        ga: 8,
        Ra: 0,
        La: 25
    }
};
var rq = {
    CD: {
        ta: "痛苦",
        description: "对怪物无情",
        ca: "Skull Cross",
        ya: "Skull Cross",
        X: null,
        ga: 4,
        Ra: 0,
        La: 13,
        bo: !0
    },
    xD: {
        ta: "绿色死亡",
        description: "弹跳死亡",
        ca: "Green Skull",
        ya: "Green Skull",
        X: null,
        ga: 13,
        Ra: 0,
        La: 20
    },
    OB: {
        ta: "骷髅军队",
        description: "骷髅复活!",
        ca: "Red Damage",
        ya: "Green Projectile",
        X: null,
        ga: 11,
        Ra: 1,
        La: 25
    },
    NB: {
        ta: "幽灵骷髅",
        description: "法师同伴",
        ca: "Red Damage",
        ya: null,
        X: null,
        ga: 9,
        Ra: 1,
        La: 25
    }
};
var sq = {
    PB: {
        ta: "狼群",
        description: "召唤狼群",
        ca: "Red Damage",
        ya: null,
        X: null,
        ga: 10,
        Ra: 1,
        La: 25,
        bo: !0
    },
    LB: {
        ta: "狗狗守卫",
        description: "犬科伙伴",
        ca: "Red Damage",
        ya: null,
        X: null,
        ga: 9,
        Ra: 1,
        La: 25
    },
    cE: {
        ta: "小型治疗术",
        description: "回复25%生命",
        ca: "Red Crosses",
        ya: "Red Crosses",
        X: null,
        ga: 1,
        Ra: 25,
        La: 25
    },
    DE: {
        ta: "睡眠",
        description: "怪物陷入睡眠",
        ca: "Sleep",
        ya: "Pink Star",
        X: 0,
        ga: 2,
        td: !0,
        Ra: 0,
        La: 20
    }
};
var tq = {
    Hx: {
        ta: "快速打击",
        description: "怪物迅速死亡",
        ca: "White Damage",
        ya: "Grey Bullet",
        X: null,
        ga: 12,
        td: !1,
        Ra: 100,
        La: 30
    }
};
var uq = {
    KB: {
        ta: "召唤鸡群",
        description: "鸡王标配法术",
        ca: "Red Damage",
        ya: null,
        X: null,
        ga: 17,
        Ra: 1,
        La: 25,
        bo: !0
    },
    MB: {
        ta: "小鸡守卫",
        description: "小鸡伙伴",
        ca: "Red Damage",
        ya: null,
        X: null,
        ga: 9,
        Ra: 1,
        La: 25
    }
};
function li(a) {
    this.ta = a.ta;
    this.ga = a.ga;
    this.ca = a.ca;
    this.ya = a.ya;
    this.X = a.X;
    this.Ra = a.Ra;
    this.La = a.La;
    this.mq = w.i.$a - 3 * this.La;
    this.td = a.td
}
function vq(a) {
    a.mq = w.i.$a - 3 * a.La
}
function wq(a) {
    a.mq > w.i.$a && vq(a);
    return w.i.$a - a.mq >= a.La
};
function xq(a, b) {
    this.eq = b;
    this.qg = a.qg;
    this.Wh = w.Kj.v(a.Wh);
    this.ke = a.rg;
    this.sg = a.sg;
    this.Yi = a.Yi;
    this.Qh = a.Qh;
    this.mB = a.xa ? new li(a.xa) : null;
    this.tn = a.fq;
    this.Qe = !0;
    this.mh = this.tg = 0;
    this.rn = yq(this);
    this.rg = zq(this);
    this.lx = Aq(this)
}
function Bq(a) {
    return a.Wh
}
function Cq(a) {
    a.mh++;
    var b = 30 + Dq.t;
    a.mh > b && (a.mh = b)
}
function yq(a) {
    return Ia(a.Qe ? a.sg: a.sg + (a.tg + 1) * a.Yi, Eq, 1)
}
function zq(a) {
    if (a.Qe) return "未解锁";
    switch (a.tg) {
    case 1:
        return a.ke + " II";
    case 2:
        return a.ke + " III";
    case 3:
        return a.ke + " IV";
    case 4:
        return a.ke + " V";
    case 5:
        return a.ke + " VI";
    case 6:
        return a.ke + " VII";
    case 7:
        return a.ke + " VIII"
    }
    return a.ke
}
function Aq(a) {
    if (!a.Qe) switch (a.tg) {
    case 0:
        return a.ke + " II";
    case 1:
        return a.ke + " III";
    case 2:
        return a.ke + " IV";
    case 3:
        return a.ke + " V";
    case 4:
        return a.ke + " VI";
    case 5:
        return a.ke + " VII";
    case 6:
        return a.ke + " VIII"
    }
    return a.ke
}
xq.prototype.ts = function(a, b) {
    this.Qe && !a && (this.Qe = !1, Fq(w.nh, this));
    this.tg = b;
    if (0 < b && this.tn) {
        var c;
        for (c = 0; c < this.tg; c++) Qi(w.i.ce, this.tn.f, this.tn.g);
        Gq()
    }
    this.rg = zq(this);
    this.lx = Aq(this);
    this.rn = yq(this)
};
function Hq(a, b) {
    if (!a.Qe && (0 < a.mh || b)) {
        var c;
        c = w.i.D[k(w.i.D.length)];
        var d = qi(c);
        if (0 === d.length) c = null;
        else {
            var f = c.p.w;
            if (f) {
                var g, h, l = c.p.u,
                n = null,
                p, s = -1;
                for (h = 0; h < d.length; h++)(g = d[h], c === g || g.Va || g.p.w !== f || (p = g.Ja, p.wg || p.Kd || p.bi || -1 < a.eq.yl.indexOf(g) || (p = l.Ud(g.p.u), !(0 > s || p < s)))) || (n = g, s = p);
                c = n
            } else c = null
        }
        c || (c = Iq(w.i.D[k(w.i.D.length)]), c || (c = xh(), c = 0 === c.length ? null: c[k(c.length)]));
        c && (d = a.eq, 0 > d.yl.indexOf(c) && (d.yl.push(c), 4 <= d.yl.length && d.yl.shift()), d = w.i.ce.p, d.w = c.p.w, w.i.ce.Cb(c), a.mB ? (w.i.ce.ld = a.mB, w.i.ce.Y = Jq) : w.i.ce.Y = Kq, c = new Zb("Red Damage", d.u, d.u, !1, 1), pc(w.df, c), Lq(w.i.ce, 1), w.i.aa.fs(), b || (a.mh--, 0 > a.mh && (a.mh = 0)))
    }
};
function kh() {
    var a = w.eq;
    0 < a.yl.length && (a.yl.length = 0)
};
function Mq(a, b, c, d) {
    this.scroll = a;
    this.bq = b;
    this.cq = c;
    this.BE = d;
    this.gc = !1;
    this.Zc = null;
    this.ph = 0
}
e = Mq.prototype;
e.vf = function() {
    return this.scroll
};
e.oh = function(a) {
    this.gc = a
};
e.Re = function(a) {
    this.Zc = a
};
e.Ud = function() {
    return this.ph
};
e.Se = function(a) {
    this.ph = a
};
function Nq() {
    this.kf = []
}
Nq.prototype.zl = function() {
    var a;
    for (a = 0; a < this.kf.length; a++) this.kf[a].Re(null),
    this.kf[a].Se(0)
};
function Oq(a) {
    var b = w.Uh;
    a = b.kf.indexOf(a); - 1 < a && b.kf.splice(a, 1)
};
var Pq = [{
    qg: "shockScroll",
    rg: "休克",
    Wh: "Scroll0028.PNG",
    xa: kq.sB,
    sg: 0,
    Yi: 4,
    Qh: 0
},
{
    qg: "spiderWebScroll",
    rg: "蛛网",
    Wh: "Scroll0054.PNG",
    xa: kq.CB,
    sg: 3,
    Yi: 4,
    Qh: 4,
    fq: {
        f: 20,
        g: 2
    }
},
{
    qg: "arrowScroll",
    rg: "箭矢",
    Wh: "Scroll0012.PNG",
    xa: null,
    sg: 6,
    Yi: 4,
    Qh: 4,
    fq: {
        f: 23,
        g: 1
    }
},
{
    qg: "fireRainScroll",
    rg: "火雨",
    Wh: "Scroll0022.PNG",
    xa: lq.Lz,
    sg: 9,
    Yi: 4,
    Qh: 2,
    fq: {
        f: 22,
        g: 1
    }
},
{
    qg: "chainedLightningScroll",
    rg: "闪电",
    Wh: "Scroll0034.PNG",
    xa: kq.br,
    sg: 12,
    Yi: 4,
    Qh: 3,
    fq: {
        f: 21,
        g: 1
    }
},
{
    qg: "fireBallScroll",
    rg: "火球",
    Wh: "Scroll0097.PNG",
    xa: lq.Kz,
    sg: 15,
    Yi: 4,
    Qh: 2,
    fq: {
        f: 25,
        g: 1
    }
}];
function Qq() {
    this.kx = {};
    this.at = [];
    this.Pl = []
}
function Rq() {
    var a = w.nh;
    a.kx = {};
    a.at.length = 0;
    a.Pl.length = 0;
    var b, c;
    for (b = 0; b < Pq.length; b++) c = new xq(Pq[b], w.eq),
    c.ts(0 < Pq[b].sg, 0),
    a.at.push(c),
    a.kx[c.qg] = c,
    c.Qe || Fq(a, c)
}
function Fq(a, b) {
    0 > a.Pl.indexOf(b) && a.Pl.push(b)
}
Qq.prototype.vf = function(a) {
    return this.kx[a]
};
var Sq = [{
    ic: "doubleGoldDropValue",
    uc: "双倍黄金",
    tc: "黄金掉落x2",
    jc: "PotionLargeRose.PNG",
    vc: 2
},
{
    ic: "doubleKills",
    uc: "双倍杀戮",
    tc: "杀戮翻倍",
    jc: "PotionLargeViolet.PNG",
    vc: 1
},
{
    ic: "doubleExperience",
    uc: "双倍经验",
    tc: "经验翻倍",
    jc: "PotionPurple.PNG",
    vc: 3
},
{
    ic: "speedWalker",
    uc: "快速行走",
    tc: "+25%速度",
    jc: "PotionShortRuby.PNG",
    vc: 4
},
{
    ic: "fasterFarming",
    uc: "快速收获",
    tc: "提高收获速度",
    jc: "PotionTallGreen.PNG",
    vc: 5
},
{
    ic: "fasterInfestation",
    uc: "快速侵扰",
    tc: "快速开始收获",
    jc: "PotionSquareBlue.PNG",
    vc: 6
},
{
    ic: "infiniteScrolls",
    uc: "无限卷轴",
    tc: "开火",
    jc: "PotionShortSilver.PNG",
    vc: 7
},
{
    ic: "moreMonsters",
    uc: "更多怪物",
    tc: "每个房间内怪物+10",
    jc: "PotionRoundedTopaz.PNG",
    vc: 8
},
{
    ic: "guaranteedItemDrops",
    uc: "100%道具掉落",
    tc: "所有怪物掉落道具",
    jc: "PotionShortPink.PNG",
    vc: 9
},
{
    ic: "potionDuration",
    uc: "药剂持续更久",
    tc: "梅塔药剂",
    jc: "PotionRed.PNG",
    vc: 10
},
{
    ic: "freeSpellCasting",
    uc: "法术无消耗",
    tc: "法术不消耗法力",
    jc: "PotionTriangularYellow.PNG",
    vc: 11
},
{
    ic: "moreKillsPerFarm",
    uc: "每次收获更多杀戮",
    tc: "收获杀戮翻倍",
    jc: "PotionEmerald.PNG",
    vc: 12
},
{
    ic: "docileMonsters",
    uc: "驯养怪物",
    tc: "怪物无害",
    jc: "PotionShortTan.PNG",
    vc: 13
},
{
    ic: "higherItemValues",
    uc: "道具价值",
    tc: "新道具+20%黄金",
    jc: "PotionTallYellow2.PNG",
    vc: 14
},
{
    ic: "frailMonsters",
    uc: "脆弱怪物",
    tc: "怪物容易死亡",
    jc: "PotionShortOrange.PNG",
    vc: 15
},
{
    ic: "autoFiringScrolls",
    uc: "卷轴自动开火",
    tc: "卷轴无需消耗自动使用",
    jc: "PotionLargeGreen.PNG",
    vc: 16
},
{
    ic: "doubleGoldDrops",
    uc: "双倍黄金掉落",
    tc: "每个怪物掉落双倍黄金",
    jc: "PotionTriangularRuby.PNG",
    vc: 17
},
{
    ic: "doubleItemDrops",
    uc: "双倍道具掉落",
    tc: "每个怪物掉落双倍道具",
    jc: "PotionLargeTan.PNG",
    vc: 18
},
{
    ic: "randomTreasureRoom",
    uc: "随机财宝室",
    tc: "25%几率/房间",
    jc: "PotionShortTan2.PNG",
    vc: 19
},
{
    ic: "randomBossEncounter",
    uc: "随机首领战",
    tc: "20%几率/房间",
    jc: "PotionTallBrown.PNG",
    vc: 20
}];
function Tq(a) {
    this.ic = a.ic;
    this.jc = w.Kj.v(a.jc);
    this.uc = a.uc;
    this.tc = a.tc;
    this.vc = a.vc;
    this.Oe = !1;
    this.Vl = 0;
    this.mg = Uq(this.vc)
}
function Vq(a, b) {
    var c = a.Oe;
    a.Oe = b;
    a.Oe && !c ? a.mg && (a.mg.t = a.mg.nc) : !a.Oe && c && a.mg && (a.mg.t = a.mg.defaultValue)
}
Tq.prototype.aw = function() {
    this.Oe || !this.Oe && Wq(this) || (this.Oe = !0, this.Vl = w.i.$a, this.mg && (this.mg.t = this.mg.nc), w.i.aa.cs())
};
function Uq(a) {
    switch (a) {
    case 2:
        return Xq;
    case 1:
        return Yq;
    case 3:
        return Zq;
    case 4:
        return $q;
    case 5:
        return ar;
    case 6:
        return br;
    case 7:
        return cr;
    case 8:
        return Sh;
    case 9:
        return dr;
    case 10:
        return er;
    case 11:
        return fr;
    case 12:
        return gr;
    case 13:
        return hr;
    case 14:
        return ir;
    case 15:
        return Zh;
    case 16:
        return jr;
    case 17:
        return kr;
    case 18:
        return lr;
    case 19:
        return Bg;
    case 20:
        return Qh
    }
    console.log("potion type error: " + a);
    return null
}
function Wq(a) {
    return a.mg && a.mg.t === a.mg.nc
};
function mr(a, b, c, d) {
    this.hc = a;
    this.Qp = b;
    this.Rp = c;
    this.oE = d;
    this.gc = !1;
    this.Zc = null;
    this.ph = 0
}
mr.prototype.oh = function(a) {
    this.gc = a
};
mr.prototype.Re = function(a) {
    this.Zc = a
};
mr.prototype.Ud = function() {
    return this.ph
};
mr.prototype.Se = function(a) {
    this.ph = a
};
function nr() {
    this.Hf = []
}
nr.prototype.zl = function() {
    var a;
    for (a = 0; a < this.Hf.length; a++) this.Hf[a].Re(null),
    this.Hf[a].Se(0)
};
function or(a) {
    var b = w.Ti;
    a = b.Hf.indexOf(a); - 1 < a && b.Hf.splice(a, 1)
};
function pr() {
    this.re = []
}
function qr() {
    var a = w.Yj;
    if (0 < a.re.length) {
        var b;
        for (b = 0; b < a.re.length; b++) Vq(a.re[b], !1);
        a.re.length = 0
    }
}
function rr(a) {
    var b = w.Yj;
    a && b.re.length < sr + tr.t && b.re.push(a)
}
pr.prototype.bw = function(a) {
    if (a) {
        var b = this.re.indexOf(a); - 1 < b && this.re.splice(b, 1);
        a.Oe && Vq(a, !1)
    }
};
var yh = 3,
Ld = 4,
Pd = 5;
var ur = {
    h: 1,
    Fb: 1,
    Dc: 1,
    yc: 1,
    Fc: "杀死一个怪物",
    Gc: "杀死怪物"
},
vr = {
    h: 2,
    Fb: 1,
    Dc: 1,
    yc: 1,
    Fc: "打开一扇门",
    Gc: "打开门"
},
wr = {
    h: yh,
    Fb: 5,
    Dc: 5,
    yc: 5,
    Fc: "胜一场遭遇战",
    Gc: "遭遇战胜利"
},
xr = {
    h: Ld,
    Fb: 100,
    Dc: 100,
    yc: 100,
    Fc: "清空一个关卡",
    Gc: "清空关卡"
},
yr = {
    h: Pd,
    Fb: 300,
    Dc: 300,
    yc: 300,
    Fc: "清理一个地牢",
    Gc: "征服地牢"
},
zr = {
    h: 19,
    Fb: 2E3,
    Dc: 2E3,
    yc: 2E3,
    Fc: "征服一座城堡",
    Gc: "征服城堡"
},
Ar = {
    h: 6,
    Fb: 50,
    Dc: 50,
    yc: 50,
    Fc: "搜索一个财宝箱",
    Gc: "搜索财宝箱"
},
Br = {
    h: 7,
    Fb: 50,
    Dc: 50,
    yc: 50,
    Fc: "搜索一个武器架",
    Gc: "搜索武器架"
},
Cr = {
    h: 8,
    Fb: 50,
    Dc: 50,
    yc: 50,
    Fc: "搜索一个书架",
    Gc: "搜索书架"
},
Dr = {
    h: 10,
    Fb: 2,
    Dc: 2,
    yc: 2,
    Fc: "找到一个卷轴",
    Gc: "找到卷轴"
},
Er = {
    h: 11,
    Fb: 15,
    Dc: 15,
    yc: 15,
    Fc: "找到一瓶药剂",
    Gc: "找到药剂"
},
Fr = {
    h: 12,
    Fb: 1,
    Dc: 1,
    yc: 1,
    Fc: "找到一件道具",
    Gc: "找到道具"
},
Gr = {
    h: 9,
    Fb: 1,
    Dc: 1,
    yc: 1,
    Fc: "找到黄金",
    Gc: "找到黄金"
},
Hr = {
    h: 18,
    Fb: 15,
    Dc: 15,
    yc: 15,
    Fc: "召唤一个宠物",
    Gc: "召唤宠物"
},
Ir = {
    h: 13,
    Fb: 5,
    Dc: 5,
    yc: 5,
    Fc: "找到一件罕见道具",
    Gc: "找到罕见道具"
},
Jr = {
    h: 14,
    Fb: 25,
    Dc: 25,
    yc: 25,
    Fc: "找到一件稀有道具",
    Gc: "找到稀有道具"
},
Kr = {
    h: 15,
    Fb: 200,
    Dc: 200,
    yc: 200,
    Fc: "找到一件历史道具",
    Gc: "找到历史道具"
},
Lr = {
    h: 16,
    Fb: 2E3,
    Dc: 2E3,
    yc: 2E3,
    Fc: "找到一件远古道具",
    Gc: "找到远古道具"
},
Mr = {
    h: 17,
    Fb: 1,
    Dc: 1,
    yc: 1,
    Fc: "卖出一件道具",
    Gc: "卖出道具"
},
Nr = {
    h: 21,
    Fb: 10,
    Dc: 10,
    yc: 10,
    Fc: "装备一件道具",
    Gc: "装备道具"
},
Or = {
    h: 22,
    Fb: 400,
    Dc: 400,
    yc: 400,
    Fc: "角色升一级",
    Gc: "升级"
},
Pr = {};
Pr[1] = ur;
Pr[2] = vr;
Pr[yh] = wr;
Pr[Ld] = xr;
Pr[Pd] = yr;
Pr[19] = zr;
Pr[6] = Ar;
Pr[7] = Br;
Pr[8] = Cr;
Pr[10] = Dr;
Pr[11] = Er;
Pr[12] = Fr;
Pr[9] = Gr;
Pr[18] = Hr;
Pr[13] = Ir;
Pr[14] = Jr;
Pr[15] = Kr;
Pr[16] = Lr;
Pr[17] = Mr;
Pr[21] = Nr;
Pr[22] = Or;
var Qr = [ur, vr, wr, xr, yr, zr, Ar, Br, Cr, Dr, Er, Fr, Gr, Hr, Ir, Jr, Kr, Lr, Mr, Nr, Or];
var Rr = [{
    Yb: "moreScrollsInStack",
    title: "更多卷轴",
    mc: "最大卷轴+10",
    Gb: 5E5,
    Tb: 1
},
{
    Yb: "cheaperFarms",
    title: "便宜农场",
    mc: "10%农场折扣",
    Gb: 1E6,
    Tb: 5
},
{
    Yb: "extraPotionSlot1",
    title: "额外药剂槽",
    mc: "多一瓶药剂",
    Gb: 25E5,
    Tb: 3
},
{
    Yb: "extraPotionSlot2",
    title: "额外药剂槽",
    mc: "多一瓶药剂",
    Gb: 25E5,
    Tb: 3
},
{
    Yb: "walkingSpeedBoost1",
    title: "行走速度提升",
    mc: "行走速度提高10%",
    Gb: 4E6,
    Tb: 2
},
{
    Yb: "walkingSpeedBoost2",
    title: "行走速度提升",
    mc: "行走速度提高10%",
    Gb: 4E6,
    Tb: 2
},
{
    Yb: "offlineTimeBonus1",
    title: "离线时间加成功",
    mc: "+2小时",
    Gb: 5E6,
    Tb: 9
},
{
    Yb: "offlineTimeBonus2",
    title: "离线时间加成功",
    mc: "+2小时",
    Gb: 5E6,
    Tb: 9
},
{
    Yb: "cheaperMonsterLevels",
    title: "便宜怪物等级",
    mc: "10%等级折扣",
    Gb: 6E6,
    Tb: 6
},
{
    Yb: "cheaperMonsterLevels2",
    title: "便宜怪物等级",
    mc: "10%等级折扣",
    Gb: 6E6,
    Tb: 6
},
{
    Yb: "itemSales1",
    title: "道具卖价提高",
    mc: "商店回收价提高10%",
    Gb: 8E6,
    Tb: 10
},
{
    Yb: "itemSales2",
    title: "道具卖价提高",
    mc: "商店回收价提高10%",
    Gb: 8E6,
    Tb: 10
},
{
    Yb: "moreFarmKills1",
    title: "每次收获更多杀戮",
    mc: "收获杀戮+20",
    Gb: 7E6,
    Tb: 8
},
{
    Yb: "moreFarmKills2",
    title: "每次收获更多杀戮",
    mc: "收获杀戮+20",
    Gb: 7E6,
    Tb: 8
},
{
    Yb: "potionTurnDuration1",
    title: "药剂持续",
    mc: "持续时间延长15%",
    Gb: 8E6,
    Tb: 7
},
{
    Yb: "potionTurnDuration",
    title: "药剂持续",
    mc: "持续时间延长15%",
    Gb: 8E6,
    Tb: 7
},
{
    Yb: "extraCharacterSlot",
    title: "第5个角色栏",
    mc: "更多杀戮",
    Gb: 1E7,
    Tb: 4
},
{
    Yb: "coolDownTurn1",
    title: "永久快速攻击",
    mc: "攻击冷却回合-1",
    Gb: 11E6,
    Tb: 11
},
{
    Yb: "coolDownTurn2",
    title: "永久快速攻击",
    mc: "攻击冷却回合-1",
    Gb: 11E6,
    Tb: 11
},
{
    Yb: "healthRegeneration1",
    title: "快速治愈",
    mc: "队伍回复+1%",
    Gb: 12E6,
    Tb: 12
},
{
    Yb: "healthRegeneration2",
    title: "快速治愈",
    mc: "队伍回复+1%",
    Gb: 12E6,
    Tb: 12
},
{
    Yb: "spiritRegeneration1",
    title: "法力回复",
    mc: "队伍回复+1%",
    Gb: 13E6,
    Tb: 13
},
{
    Yb: "spiritRegeneration2",
    title: "法力回复",
    mc: "队伍回复+1%",
    Gb: 13E6,
    Tb: 13
}];
function Sr() {
    var a = w.i.ae;
    a.Dd = 0;
    a.An = 0;
    a.Qi = {};
    a.pj = {};
    var b, c;
    for (b = 0; b < Qr.length; b++) c = Qr[b],
    c.Fb = c.Dc,
    a.Qi[c.h] && console.log("error - duplicate point event type: " + c.h),
    a.Qi[c.h] = 0,
    a.pj[c.h] = 0;
    for (b = 0; b < a.tl.length; b++) a.tl[b].og()
}
function Kd(a) {
    var b = w.i.ae,
    c = Pr[a];
    if (c) {
        c = c.Fb;
        b.Dd += c;
        var d = b.Qi[a];
        d || (d = 0);
        var f = b.pj[a];
        f || (f = 0);
        f++;
        b.Qi[a] = d + c;
        b.pj[a] = f
    } else console.log("error: point settings not found: " + a)
}
function Tr(a, b) {
    var c = w.i.ae,
    d = Pr[a];
    d ? (d.Fb += b, Ur(c)) : console.log("error: point settings not found: " + a)
}
function Ur(a) {
    var b, c, d, f;
    for (b = a.Dd = 0; b < Qr.length; b++) f = Qr[b].h,
    c = Qr[b].Fb,
    (d = a.pj[f]) || (d = 0),
    c *= d,
    a.Qi[f] = c,
    a.Dd += c;
    a.Dd -= a.An;
    0 > a.Dd && (a.Dd = 0)
};
var Vr = [{
    k: "monsterKills100",
    l: "杀死100个怪物",
    m: 1,
    j: 100,
    h: 1
},
{
    k: "monsterKills1000",
    l: "杀死1,000个怪物",
    m: 1,
    j: 1E3,
    h: 21
},
{
    k: "monsterKills5K",
    l: "杀死5,000个怪物",
    m: 1,
    j: 5E3,
    h: 1
},
{
    k: "monsterKills10K",
    l: "杀死10,000个怪物",
    m: 1,
    j: 1E4,
    h: 13
},
{
    k: "monsterKills25K",
    l: "杀死25,000个怪物",
    m: 1,
    j: 25E3,
    h: 1
},
{
    k: "monsterKills50K",
    l: "杀死50,000个怪物",
    m: 1,
    j: 5E4,
    h: 14
},
{
    k: "monsterKills100K",
    l: "杀死100,000个怪物",
    m: 1,
    j: 1E5,
    h: 1
},
{
    k: "monsterKills250K",
    l: "杀死250,000个怪物",
    m: 1,
    j: 25E4,
    h: 15
},
{
    k: "monsterKills500K",
    l: "杀死500,000个怪物",
    m: 1,
    j: 5E5,
    h: 1
},
{
    k: "monsterKills1M",
    l: "杀死1,000,000个怪物",
    m: 1,
    j: 1E6,
    h: 16
},
{
    k: "monsterKills2M",
    l: "杀死2,000,000个怪物",
    m: 1,
    j: 2E6,
    h: 2
},
{
    k: "scrollKills100",
    l: "100个怪物被卷轴杀死",
    m: 2,
    j: 100,
    h: 2
},
{
    k: "scrollKills500",
    l: "500个怪物被卷轴杀死",
    m: 2,
    j: 500,
    h: 22
},
{
    k: "scrollKills1000",
    l: "1,000个怪物被卷轴杀死",
    m: 2,
    j: 1E3,
    h: yh
},
{
    k: "scrollKills2K",
    l: "2,000个怪物被卷轴杀死",
    m: 2,
    j: 2E3,
    h: 9
},
{
    k: "scrollKills3K",
    l: "3,000个怪物被卷轴杀死",
    m: 2,
    j: 3E3,
    h: 12
},
{
    k: "scrollKills5K",
    l: "5,000个怪物被卷轴杀死",
    m: 2,
    j: 5E3,
    h: 1
},
{
    k: "scrollKills7K",
    l: "7,000个怪物被卷轴杀死",
    m: 2,
    j: 7E3,
    h: 7
},
{
    k: "scrollKills10K",
    l: "10,000个怪物被卷轴杀死",
    m: 2,
    j: 1E4,
    h: 2
},
{
    k: "scrollKills15K",
    l: "15,000个怪物被卷轴杀死",
    m: 2,
    j: 15E3,
    h: 19
},
{
    k: "scrollKills20K",
    l: "20,000个怪物被卷轴杀死",
    m: 2,
    j: 2E4,
    h: 21
},
{
    k: "scrollUses100",
    l: "100个卷轴已使用",
    m: 3,
    j: 100,
    h: 10
},
{
    k: "scrollUses300",
    l: "300个卷轴已使用",
    m: 3,
    j: 300,
    h: 18
},
{
    k: "scrollUses500",
    l: "500个卷轴已使用",
    m: 3,
    j: 500,
    h: Pd
},
{
    k: "scrollUses750",
    l: "750个卷轴已使用",
    m: 3,
    j: 750,
    h: 21
},
{
    k: "scrollUses1000",
    l: "1,000个卷轴已使用",
    m: 3,
    j: 1E3,
    h: 13
},
{
    k: "scrollUses2K",
    l: "2,000个卷轴已使用",
    m: 3,
    j: 2E3,
    h: 14
},
{
    k: "scrollUses3K",
    l: "3,000个卷轴已使用",
    m: 3,
    j: 3E3,
    h: 15
},
{
    k: "scrollUses4K",
    l: "4,000个卷轴已使用",
    m: 3,
    j: 4E3,
    h: 16
},
{
    k: "scrollUses5K",
    l: "5,000个卷轴已使用",
    m: 3,
    j: 5E3,
    h: 17
},
{
    k: "scrollUses7500",
    l: "7,500个卷轴已使用",
    m: 3,
    j: 7500,
    h: 18
},
{
    k: "scrollUses15K",
    l: "15,000个卷轴已使用",
    m: 3,
    j: 15E3,
    h: 21
},
{
    k: "scrollUses30K",
    l: "30,000个卷轴已使用",
    m: 3,
    j: 3E4,
    h: 6
},
{
    k: "scrollUses45K",
    l: "45,000个卷轴已使用",
    m: 3,
    j: 45E3,
    h: 7
},
{
    k: "scrollUses60K",
    l: "60,000个卷轴已使用",
    m: 3,
    j: 6E4,
    h: 8
},
{
    k: "potionUses100",
    l: "100药剂已使用",
    m: 4,
    j: 100,
    h: 8
},
{
    k: "potionUses200",
    l: "200药剂已使用",
    m: 4,
    j: 200,
    h: 7
},
{
    k: "potionUses300",
    l: "300药剂已使用",
    m: 4,
    j: 300,
    h: 6
},
{
    k: "potionUses400",
    l: "400药剂已使用",
    m: 4,
    j: 400,
    h: 11
},
{
    k: "potionUses500",
    l: "500药剂已使用",
    m: 4,
    j: 500,
    h: 10
},
{
    k: "potionUses750",
    l: "750药剂已使用",
    m: 4,
    j: 750,
    h: 2
},
{
    k: "potionUses1000",
    l: "1000药剂已使用",
    m: 4,
    j: 1E3,
    h: 17
},
{
    k: "potionUses1250",
    l: "1250药剂已使用",
    m: 4,
    j: 1250,
    h: 11
},
{
    k: "potionUses2K",
    l: "2000药剂已使用",
    m: 4,
    j: 2E3,
    h: 10
},
{
    k: "potionUses2500",
    l: "2500药剂已使用",
    m: 4,
    j: 2500,
    h: 21
},
{
    k: "potionUses3K",
    l: "3000药剂已使用",
    m: 4,
    j: 3E3,
    h: 17
},
{
    k: "treasureChests10",
    l: "10个财宝箱已搜索",
    m: 5,
    j: 10,
    h: 6
},
{
    k: "treasureChests25",
    l: "25个财宝箱已搜索",
    m: 5,
    j: 25,
    h: 17
},
{
    k: "treasureChests50",
    l: "50个财宝箱已搜索",
    m: 5,
    j: 50,
    h: 9
},
{
    k: "treasureChests75",
    l: "75个财宝箱已搜索",
    m: 5,
    j: 75,
    h: 11
},
{
    k: "treasureChests100",
    l: "100个财宝箱已搜索",
    m: 5,
    j: 100,
    h: 10
},
{
    k: "treasureChests125",
    l: "125个财宝箱已搜索",
    m: 5,
    j: 125,
    h: 18
},
{
    k: "treasureChests1K",
    l: "1000个财宝箱已搜索",
    m: 5,
    j: 1E3,
    h: 2
},
{
    k: "treasureChests2500",
    l: "2500个财宝箱已搜索",
    m: 5,
    j: 2500,
    h: 9
},
{
    k: "treasureChests5K",
    l: "5,000个财宝箱已搜索",
    m: 5,
    j: 5E3,
    h: 12
},
{
    k: "treasureChests10K",
    l: "10,000个财宝箱已搜索",
    m: 5,
    j: 1E4,
    h: 11
},
{
    k: "treasureChests20K",
    l: "20,000个财宝箱已搜索",
    m: 5,
    j: 2E4,
    h: Pd
},
{
    k: "weaponRacks10",
    l: "10个武器架已搜索",
    m: 6,
    j: 10,
    h: 7
},
{
    k: "weaponRacks25",
    l: "25个武器架已搜索",
    m: 6,
    j: 25,
    h: 13
},
{
    k: "weaponRacks50",
    l: "50个武器架已搜索",
    m: 6,
    j: 50,
    h: 14
},
{
    k: "weaponRacks75",
    l: "75个武器架已搜索",
    m: 6,
    j: 75,
    h: 15
},
{
    k: "weaponRacks100",
    l: "100个武器架已搜索",
    m: 6,
    j: 100,
    h: 16
},
{
    k: "weaponRacks125",
    l: "125个武器架已搜索",
    m: 6,
    j: 125,
    h: 17
},
{
    k: "weaponRacks1K",
    l: "1,000个武器架已搜索",
    m: 6,
    j: 1E3,
    h: 13
},
{
    k: "weaponRacks2500",
    l: "2,500个武器架已搜索",
    m: 6,
    j: 2500,
    h: 14
},
{
    k: "weaponRacks5K",
    l: "5,000个武器架已搜索",
    m: 6,
    j: 5E3,
    h: 15
},
{
    k: "weaponRacks10K",
    l: "10,000个武器架已搜索",
    m: 6,
    j: 1E4,
    h: 16
},
{
    k: "weaponRacks20K",
    l: "20,000个武器架已搜索",
    m: 6,
    j: 2E4,
    h: 8
},
{
    k: "bookcases10",
    l: "10个书架已搜索",
    m: 7,
    j: 10,
    h: 8
},
{
    k: "bookcases25",
    l: "25个书架已搜索",
    m: 7,
    j: 25,
    h: 7
},
{
    k: "bookcases50",
    l: "50个书架已搜索",
    m: 7,
    j: 50,
    h: 6
},
{
    k: "bookcases75",
    l: "75个书架已搜索",
    m: 7,
    j: 75,
    h: 8
},
{
    k: "bookcases100",
    l: "100个书架已搜索",
    m: 7,
    j: 100,
    h: 7
},
{
    k: "bookcases125",
    l: "125个书架已搜索",
    m: 7,
    j: 125,
    h: 6
},
{
    k: "bookcases1K",
    l: "1,000个书架已搜索",
    m: 7,
    j: 1E3,
    h: 11
},
{
    k: "bookcases2500",
    l: "2,500个书架已搜索",
    m: 7,
    j: 2500,
    h: yh
},
{
    k: "bookcases5K",
    l: "5,000个书架已搜索",
    m: 7,
    j: 5E3,
    h: 18
},
{
    k: "bookcases9K",
    l: "9,000个书架已搜索",
    m: 7,
    j: 9E3,
    h: 22
},
{
    k: "itemsSold100",
    l: "100个道具已卖出",
    m: 8,
    j: 100,
    h: 17
},
{
    k: "itemsSold500",
    l: "500个道具已卖出",
    m: 8,
    j: 500,
    h: yh
},
{
    k: "itemsSold1000",
    l: "1,000个道具已卖出",
    m: 8,
    j: 1E3,
    h: 17
},
{
    k: "itemsSold2K",
    l: "2,000个道具已卖出",
    m: 8,
    j: 2E3,
    h: 9
},
{
    k: "itemsSold3K",
    l: "3,000个道具已卖出",
    m: 8,
    j: 3E3,
    h: 10
},
{
    k: "itemsSold5K",
    l: "5,000个道具已卖出",
    m: 8,
    j: 5E3,
    h: 11
},
{
    k: "itemsSold10K",
    l: "10,000个道具已卖出",
    m: 8,
    j: 1E4,
    h: 12
},
{
    k: "itemsSold15K",
    l: "15,000个道具已卖出",
    m: 8,
    j: 15E3,
    h: Ld
},
{
    k: "itemsSold20K",
    l: "20,000个道具已卖出",
    m: 8,
    j: 2E4,
    h: 1
},
{
    k: "itemsSold40K",
    l: "40,000个道具已卖出",
    m: 8,
    j: 4E4,
    h: 16
},
{
    k: "itemsSold60K",
    l: "60,000个道具已卖出",
    m: 8,
    j: 6E4,
    h: 8
},
{
    k: "itemsSold80K",
    l: "80,000个道具已卖出",
    m: 8,
    j: 8E4,
    h: 21
},
{
    k: "itemsSold100K",
    l: "100,000个道具已卖出",
    m: 8,
    j: 1E5,
    h: 17
},
{
    k: "farmsPurchased5",
    l: "5个农场已购买",
    m: 9,
    j: 5,
    h: 2
},
{
    k: "farmsPurchased15",
    l: "15个农场已购买",
    m: 9,
    j: 15,
    h: 9
},
{
    k: "farmsPurchased25",
    l: "25个农场已购买",
    m: 9,
    j: 25,
    h: 12
},
{
    k: "farmsPurchased50",
    l: "50个农场已购买",
    m: 9,
    j: 50,
    h: 10
},
{
    k: "farmsPurchased75",
    l: "75个农场已购买",
    m: 9,
    j: 75,
    h: 11
},
{
    k: "farmsPurchased100",
    l: "100个农场已购买",
    m: 9,
    j: 100,
    h: 13
},
{
    k: "farmsPurchased150",
    l: "150个农场已购买",
    m: 9,
    j: 150,
    h: 14
},
{
    k: "farmsPurchased200",
    l: "200个农场已购买",
    m: 9,
    j: 200,
    h: 15
},
{
    k: "farmsPurchased250",
    l: "250个农场已购买",
    m: 9,
    j: 250,
    h: 16
},
{
    k: "farmsPurchased300",
    l: "300个农场已购买",
    m: 9,
    j: 300,
    h: Pd
},
{
    k: "farmsPurchased500",
    l: "500个农场已购买",
    m: 9,
    j: 500,
    h: 2
},
{
    k: "farmsPurchased600",
    l: "600个农场已购买",
    m: 9,
    j: 600,
    h: 22
},
{
    k: "farmsPurchased700",
    l: "700个农场已购买",
    m: 9,
    j: 700,
    h: 21
},
{
    k: "dungeonsCleared10",
    l: "10个地牢已清理",
    m: 10,
    j: 10,
    h: Pd
},
{
    k: "dungeonsCleared25",
    l: "25个地牢已清理",
    m: 10,
    j: 25,
    h: 19
},
{
    k: "dungeonsCleared50",
    l: "50个地牢已清理",
    m: 10,
    j: 50,
    h: Ld
},
{
    k: "dungeonsCleared100",
    l: "100个地牢已清理",
    m: 10,
    j: 100,
    h: 17
},
{
    k: "dungeonsCleared200",
    l: "200个地牢已清理",
    m: 10,
    j: 200,
    h: 8
},
{
    k: "dungeonsCleared300",
    l: "300个地牢已清理",
    m: 10,
    j: 300,
    h: 7
},
{
    k: "dungeonsCleared400",
    l: "400个地牢已清理",
    m: 10,
    j: 400,
    h: 6
},
{
    k: "dungeonsCleared500",
    l: "500个地牢已清理",
    m: 10,
    j: 500,
    h: yh
},
{
    k: "dungeonsCleared750",
    l: "750个地牢已清理",
    m: 10,
    j: 750,
    h: Pd
},
{
    k: "dungeonsCleared1K",
    l: "1,000个地牢已清理",
    m: 10,
    j: 1E3,
    h: 21
},
{
    k: "dungeonsCleared1500",
    l: "1,500个地牢已清理",
    m: 10,
    j: 1500,
    h: Ld
},
{
    k: "dungeonsCleared2K",
    l: "2,000个地牢已清理",
    m: 10,
    j: 2E3,
    h: 17
},
{
    k: "dungeonsCleared3K",
    l: "3,000个地牢已清理",
    m: 10,
    j: 3E3,
    h: 21
},
{
    k: "dungeonsCleared4K",
    l: "4,000个地牢已清理",
    m: 10,
    j: 4E3,
    h: 22
},
{
    k: "castlesConquered5",
    l: "5个城堡已征服",
    m: 11,
    j: 5,
    h: 19
},
{
    k: "castlesConquered30",
    l: "30个城堡已征服",
    m: 11,
    j: 30,
    h: Pd
},
{
    k: "castlesConquered60",
    l: "60个城堡已征服",
    m: 11,
    j: 60,
    h: 2
},
{
    k: "castlesConquered90",
    l: "90个城堡已征服",
    m: 11,
    j: 90,
    h: 9
},
{
    k: "castlesConquered120",
    l: "120个城堡已征服",
    m: 11,
    j: 120,
    h: 11
},
{
    k: "castlesConquered150",
    l: "150个城堡已征服",
    m: 11,
    j: 150,
    h: 10
},
{
    k: "castlesConquered180",
    l: "180个城堡已征服",
    m: 11,
    j: 180,
    h: 12
},
{
    k: "castlesConquered210",
    l: "210个城堡已征服",
    m: 11,
    j: 210,
    h: 2
},
{
    k: "castlesConquered240",
    l: "240个城堡已征服",
    m: 11,
    j: 240,
    h: 8
},
{
    k: "castlesConquered270",
    l: "270个城堡已征服",
    m: 11,
    j: 270,
    h: yh
},
{
    k: "castlesConquered300",
    l: "300个城堡已征服",
    m: 11,
    j: 300,
    h: 19
},
{
    k: "spellsCast1000",
    l: "1,000次法术施放",
    m: 12,
    j: 1E3,
    h: Ld
},
{
    k: "spellsCast5K",
    l: "5,000次法术施放",
    m: 12,
    j: 5E3,
    h: Pd
},
{
    k: "spellsCast25K",
    l: "25,000次法术施放",
    m: 12,
    j: 25E3,
    h: 19
},
{
    k: "spellsCast50K",
    l: "50,000次法术施放",
    m: 12,
    j: 5E4,
    h: 16
},
{
    k: "spellsCast100K",
    l: "100,000次法术施放",
    m: 12,
    j: 1E5,
    h: 15
},
{
    k: "spellsCast150K",
    l: "150,000次法术施放",
    m: 12,
    j: 15E4,
    h: 14
},
{
    k: "spellsCast200K",
    l: "200,000次法术施放",
    m: 12,
    j: 2E5,
    h: 13
},
{
    k: "spellsCast300K",
    l: "300,000次法术施放",
    m: 12,
    j: 3E5,
    h: 9
},
{
    k: "spellsCast500K",
    l: "500,000次法术施放",
    m: 12,
    j: 5E5,
    h: 12
},
{
    k: "spellsCast700K",
    l: "700,000次法术施放",
    m: 12,
    j: 7E5,
    h: 11
},
{
    k: "spellsCast900K",
    l: "900,000次法术施放",
    m: 12,
    j: 9E5,
    h: 10
},
{
    k: "spellsCast1.1M",
    l: "1,100,000次法术施放",
    m: 12,
    j: 11E5,
    h: 21
},
{
    k: "meleeAttacks1000",
    l: "1,000次近战攻击",
    m: 13,
    j: 1E3,
    h: 21
},
{
    k: "meleeAttacks5K",
    l: "5,000次近战攻击",
    m: 13,
    j: 5E3,
    h: 9
},
{
    k: "meleeAttacks25K",
    l: "25,000次近战攻击",
    m: 13,
    j: 25E3,
    h: 12
},
{
    k: "meleeAttacks50K",
    l: "50,000次近战攻击",
    m: 13,
    j: 5E4,
    h: 11
},
{
    k: "meleeAttacks100K",
    l: "100,000次近战攻击",
    m: 13,
    j: 1E5,
    h: 10
},
{
    k: "meleeAttacks150K",
    l: "150,000次近战攻击",
    m: 13,
    j: 15E4,
    h: Ld
},
{
    k: "meleeAttacks200K",
    l: "200,000次近战攻击",
    m: 13,
    j: 2E5,
    h: 2
},
{
    k: "meleeAttacks400K",
    l: "400,000次近战攻击",
    m: 13,
    j: 4E5,
    h: 22
},
{
    k: "meleeAttacks700K",
    l: "700,000次近战攻击",
    m: 13,
    j: 7E5,
    h: 17
},
{
    k: "meleeAttacks1M",
    l: "1,000,000次近战攻击",
    m: 13,
    j: 1E6,
    h: 19
},
{
    k: "meleeAttacks1.5M",
    l: "1,500,000次近战攻击",
    m: 13,
    j: 15E5,
    h: 9
},
{
    k: "meleeAttacks2M",
    l: "2,000,000次近战攻击",
    m: 13,
    j: 2E6,
    h: 11
},
{
    k: "meleeAttacks3M",
    l: "3,000,000次近战攻击",
    m: 13,
    j: 3E6,
    h: 10
},
{
    k: "rangedAttacks1000",
    l: "1,000次远程攻击",
    m: 14,
    j: 1E3,
    h: Pd
},
{
    k: "rangedAttacks5K",
    l: "5,000次远程攻击",
    m: 14,
    j: 5E3,
    h: 9
},
{
    k: "rangedAttacks25K",
    l: "25,000次远程攻击",
    m: 14,
    j: 25E3,
    h: 11
},
{
    k: "rangedAttacks50K",
    l: "50,000次远程攻击",
    m: 14,
    j: 5E4,
    h: 10
},
{
    k: "rangedAttacks100K",
    l: "100,000次远程攻击",
    m: 14,
    j: 1E5,
    h: 12
},
{
    k: "rangedAttacks150K",
    l: "150,000次远程攻击",
    m: 14,
    j: 15E4,
    h: Ld
},
{
    k: "rangedAttacks200K",
    l: "200,000次远程攻击",
    m: 14,
    j: 2E5,
    h: 22
},
{
    k: "rangedAttacks300K",
    l: "300,000次远程攻击",
    m: 14,
    j: 3E5,
    h: 17
},
{
    k: "rangedAttacks400K",
    l: "400,000次远程攻击",
    m: 14,
    j: 4E5,
    h: 19
},
{
    k: "rangedAttacks500K",
    l: "500,000次远程攻击",
    m: 14,
    j: 5E5,
    h: 10
},
{
    k: "rangedAttacks700K",
    l: "700,000次远程攻击",
    m: 14,
    j: 7E5,
    h: 11
},
{
    k: "rangedAttacks900K",
    l: "900,000次远程攻击",
    m: 14,
    j: 9E5,
    h: 9
},
{
    k: "rangedAttacks1.2M",
    l: "1,200,000次远程攻击",
    m: 14,
    j: 12E5,
    h: 21
},
{
    k: "minionsSummoned50",
    l: "50次宠物召唤",
    m: 15,
    j: 50,
    h: Pd
},
{
    k: "minionsSummoned100",
    l: "100次宠物召唤",
    m: 15,
    j: 100,
    h: Ld
},
{
    k: "minionsSummoned250",
    l: "250次宠物召唤",
    m: 15,
    j: 250,
    h: 19
},
{
    k: "minionsSummoned500",
    l: "500次宠物召唤",
    m: 15,
    j: 500,
    h: 7
},
{
    k: "minionsSummoned750",
    l: "750次宠物召唤",
    m: 15,
    j: 750,
    h: 8
},
{
    k: "minionsSummoned1000",
    l: "1,000次宠物召唤",
    m: 15,
    j: 1E3,
    h: 6
},
{
    k: "minionsSummoned1500",
    l: "1,500次宠物召唤",
    m: 15,
    j: 1500,
    h: 22
},
{
    k: "minionsSummoned2K",
    l: "2,000次宠物召唤",
    m: 15,
    j: 2E3,
    h: 9
},
{
    k: "minionsSummoned3K",
    l: "3,000次宠物召唤",
    m: 15,
    j: 3E3,
    h: 11
},
{
    k: "minionsSummoned5K",
    l: "5,000次宠物召唤",
    m: 15,
    j: 5E3,
    h: 10
},
{
    k: "minionsSummoned30K",
    l: "30,000次宠物召唤",
    m: 15,
    j: 3E4,
    h: 17
},
{
    k: "minionsSummoned50K",
    l: "50,000次宠物召唤",
    m: 15,
    j: 5E4,
    h: 14
},
{
    k: "minionsSummoned75K",
    l: "75,000次宠物召唤",
    m: 15,
    j: 75E3,
    h: 15
},
{
    k: "minionsSummoned100K",
    l: "100,000次宠物召唤",
    m: 15,
    j: 1E5,
    h: 13
},
{
    k: "minionsSummoned125K",
    l: "125,000次宠物召唤",
    m: 15,
    j: 125E3,
    h: 16
},
{
    k: "minionsSummoned150K",
    l: "150,000次宠物召唤",
    m: 15,
    j: 15E4,
    h: 21
},
{
    k: "minionsSummoned200K",
    l: "200,000次宠物召唤",
    m: 15,
    j: 2E5,
    h: yh
},
{
    k: "minionKills100",
    l: "100个怪被宠物杀死",
    m: 28,
    j: 100,
    h: 2
},
{
    k: "minionKills1K",
    l: "1,000个怪被宠物杀死",
    m: 28,
    j: 1E3,
    h: 19
},
{
    k: "minionKills5K",
    l: "5,000个怪被宠物杀死",
    m: 28,
    j: 5E3,
    h: 17
},
{
    k: "minionKills10K",
    l: "10,000个怪被宠物杀死",
    m: 28,
    j: 1E4,
    h: 18
},
{
    k: "minionKills25K",
    l: "25,000个怪被宠物杀死",
    m: 28,
    j: 25E3,
    h: 21
},
{
    k: "minionKills50K",
    l: "50,000个怪被宠物杀死",
    m: 28,
    j: 5E4,
    h: 22
},
{
    k: "minionKills100K",
    l: "100,000个怪被宠物杀死",
    m: 28,
    j: 1E5,
    h: yh
},
{
    k: "minionKills250K",
    l: "250,000个怪被宠物杀死",
    m: 28,
    j: 25E4,
    h: 11
},
{
    k: "minionKills500K",
    l: "500,000个怪被宠物杀死",
    m: 28,
    j: 5E5,
    h: 18
},
{
    k: "minionKills750K",
    l: "750,000个怪被宠物杀死",
    m: 28,
    j: 75E4,
    h: 8
},
{
    k: "minionKills1M",
    l: "1,000,000个怪被宠物杀死",
    m: 28,
    j: 1E6,
    h: 22
},
{
    k: "characterLevel15",
    l: "角色等级达到15",
    m: 16,
    j: 15,
    h: 13
},
{
    k: "characterLevel30",
    l: "角色等级达到30",
    m: 16,
    j: 30,
    h: 14
},
{
    k: "characterLevel45",
    l: "角色等级达到45",
    m: 16,
    j: 45,
    h: 15
},
{
    k: "characterLevel60",
    l: "角色等级达到60",
    m: 16,
    j: 60,
    h: 16
},
{
    k: "characterLevel75",
    l: "角色等级达到75",
    m: 16,
    j: 75,
    h: 17
},
{
    k: "characterLevel90",
    l: "角色等级达到90",
    m: 16,
    j: 90,
    h: 12
},
{
    k: "characterLevel105",
    l: "角色等级达到105",
    m: 16,
    j: 105,
    h: 9
},
{
    k: "characterLevel120",
    l: "角色等级达到120",
    m: 16,
    j: 120,
    h: 10
},
{
    k: "characterLevel135",
    l: "角色等级达到135",
    m: 16,
    j: 135,
    h: 11
},
{
    k: "doorsOpened500",
    l: "500扇门被打开",
    m: 17,
    j: 500,
    h: yh
},
{
    k: "doorsOpened1K",
    l: "1,000扇门被打开",
    m: 17,
    j: 1E3,
    h: 2
},
{
    k: "doorsOpened2K",
    l: "2,000扇门被打开",
    m: 17,
    j: 2E3,
    h: 17
},
{
    k: "doorsOpened3K",
    l: "3,000扇门被打开",
    m: 17,
    j: 3E3,
    h: 1
},
{
    k: "doorsOpened4K",
    l: "4,000扇门被打开",
    m: 17,
    j: 4E3,
    h: 8
},
{
    k: "doorsOpened5K",
    l: "5,000扇门被打开",
    m: 17,
    j: 5E3,
    h: 7
},
{
    k: "doorsOpened7500",
    l: "7,500扇门被打开",
    m: 17,
    j: 7500,
    h: 6
},
{
    k: "doorsOpened10K",
    l: "10,000扇门被打开",
    m: 17,
    j: 1E4,
    h: 13
},
{
    k: "doorsOpened15K",
    l: "15,000扇门被打开",
    m: 17,
    j: 15E3,
    h: 14
},
{
    k: "doorsOpened20K",
    l: "20,000扇门被打开",
    m: 17,
    j: 2E4,
    h: 15
},
{
    k: "doorsOpened30K",
    l: "30,000扇门被打开",
    m: 17,
    j: 3E4,
    h: 16
},
{
    k: "doorsOpened40K",
    l: "40,000扇门被打开",
    m: 17,
    j: 4E4,
    h: 1
},
{
    k: "doorsOpened50K",
    l: "50,000扇门被打开",
    m: 17,
    j: 5E4,
    h: 2
},
{
    k: "doorsOpened75K",
    l: "75,000扇门被打开",
    m: 17,
    j: 75E3,
    h: 21
},
{
    k: "doorsOpened100K",
    l: "100,000扇门被打开",
    m: 17,
    j: 1E5,
    h: 22
},
{
    k: "doorsOpened125K",
    l: "125,000扇门被打开",
    m: 17,
    j: 125E3,
    h: 16
},
{
    k: "doorsOpened150K",
    l: "150,000扇门被打开",
    m: 17,
    j: 15E4,
    h: 15
},
{
    k: "doorsOpened175K",
    l: "175,000扇门被打开",
    m: 17,
    j: 175E3,
    h: 14
},
{
    k: "itemsFound500",
    l: "500个道具被找到",
    m: 18,
    j: 500,
    h: 12
},
{
    k: "itemsFound1000",
    l: "1,000个道具被找到",
    m: 18,
    j: 1E3,
    h: 9
},
{
    k: "itemsFound5K",
    l: "5,000个道具被找到",
    m: 18,
    j: 5E3,
    h: 11
},
{
    k: "itemsFound10K",
    l: "10,000个道具被找到",
    m: 18,
    j: 1E4,
    h: 10
},
{
    k: "itemsFound25K",
    l: "25,000个道具被找到",
    m: 18,
    j: 25E3,
    h: Ld
},
{
    k: "itemsFound50K",
    l: "50,000个道具被找到",
    m: 18,
    j: 5E4,
    h: Pd
},
{
    k: "itemsFound100K",
    l: "100,000个道具被找到",
    m: 18,
    j: 1E5,
    h: 19
},
{
    k: "itemsFound200K",
    l: "200,000个道具被找到",
    m: 18,
    j: 2E5,
    h: 1
},
{
    k: "itemsFound300K",
    l: "300,000个道具被找到",
    m: 18,
    j: 3E5,
    h: 2
},
{
    k: "itemsFound400K",
    l: "400,000个道具被找到",
    m: 18,
    j: 4E5,
    h: 9
},
{
    k: "itemsFound500K",
    l: "500,000个道具被找到",
    m: 18,
    j: 5E5,
    h: 12
},
{
    k: "itemsFound600K",
    l: "600,000个道具被找到",
    m: 18,
    j: 6E5,
    h: 11
},
{
    k: "itemsFound700K",
    l: "700,000个道具被找到",
    m: 18,
    j: 7E5,
    h: 10
},
{
    k: "itemsFound800K",
    l: "800,000个道具被找到",
    m: 18,
    j: 8E5,
    h: 12
},
{
    k: "itemsFound1M",
    l: "1,000,000个道具被找到",
    m: 18,
    j: 1E6,
    h: Ld
},
{
    k: "itemsFound1.25M",
    l: "1,250,000个道具被找到",
    m: 18,
    j: 125E4,
    h: 22
},
{
    k: "itemsFound1.5M",
    l: "1,500,000个道具被找到",
    m: 18,
    j: 15E5,
    h: 21
},
{
    k: "uncommonItemsFound100",
    l: "100个罕见道具被找到",
    m: 19,
    j: 100,
    h: Ld
},
{
    k: "uncommonItemsFound250",
    l: "250个罕见道具被找到",
    m: 19,
    j: 250,
    h: Pd
},
{
    k: "uncommonItemsFound500",
    l: "500个罕见道具被找到",
    m: 19,
    j: 500,
    h: yh
},
{
    k: "uncommonItemsFound1000",
    l: "1,000个罕见道具被找到",
    m: 19,
    j: 1E3,
    h: 13
},
{
    k: "uncommonItemsFound2500",
    l: "2,500个罕见道具被找到",
    m: 19,
    j: 2500,
    h: 2
},
{
    k: "uncommonItemsFound5000",
    l: "5,000个罕见道具被找到",
    m: 19,
    j: 5E3,
    h: 12
},
{
    k: "uncommonItemsFound10K",
    l: "10,000个罕见道具被找到",
    m: 19,
    j: 1E4,
    h: 12
},
{
    k: "uncommonItemsFound25K",
    l: "25,000个罕见道具被找到",
    m: 19,
    j: 25E3,
    h: 9
},
{
    k: "uncommonItemsFound50K",
    l: "50,000个罕见道具被找到",
    m: 19,
    j: 5E4,
    h: 10
},
{
    k: "uncommonItemsFound75K",
    l: "75,000个罕见道具被找到",
    m: 19,
    j: 75E3,
    h: 11
},
{
    k: "uncommonItemsFound100K",
    l: "100,000个罕见道具被找到",
    m: 19,
    j: 1E5,
    h: 13
},
{
    k: "uncommonItemsFound125K",
    l: "125,000个罕见道具被找到",
    m: 19,
    j: 125E3,
    h: 1
},
{
    k: "uncommonItemsFound150K",
    l: "150,000个罕见道具被找到",
    m: 19,
    j: 15E4,
    h: 13
},
{
    k: "uncommonItemsFound200K",
    l: "200,000个罕见道具被找到",
    m: 19,
    j: 2E5,
    h: Pd
},
{
    k: "uncommonItemsFound250K",
    l: "250,000个罕见道具被找到",
    m: 19,
    j: 25E4,
    h: 19
},
{
    k: "uncommonItemsFound300K",
    l: "300,000个罕见道具被找到",
    m: 19,
    j: 3E5,
    h: 22
},
{
    k: "rareItemsFound50",
    l: "50个稀有道具被找到",
    m: 20,
    j: 50,
    h: 14
},
{
    k: "rareItemsFound100",
    l: "100个稀有道具被找到",
    m: 20,
    j: 100,
    h: Ld
},
{
    k: "rareItemsFound250",
    l: "250个稀有道具被找到",
    m: 20,
    j: 250,
    h: 14
},
{
    k: "rareItemsFound500",
    l: "500个稀有道具被找到",
    m: 20,
    j: 500,
    h: 1
},
{
    k: "rareItemsFound1000",
    l: "1,000个稀有道具被找到",
    m: 20,
    j: 1E3,
    h: 14
},
{
    k: "rareItemsFound2500",
    l: "2,500个稀有道具被找到",
    m: 20,
    j: 2500,
    h: 2
},
{
    k: "rareItemsFound5K",
    l: "5,000个稀有道具被找到",
    m: 20,
    j: 5E3,
    h: 22
},
{
    k: "rareItemsFound10K",
    l: "10,000个稀有道具被找到",
    m: 20,
    j: 1E4,
    h: 17
},
{
    k: "rareItemsFound20K",
    l: "20,000个稀有道具被找到",
    m: 20,
    j: 2E4,
    h: 14
},
{
    k: "rareItemsFound30K",
    l: "30,000个稀有道具被找到",
    m: 20,
    j: 3E4,
    h: 12
},
{
    k: "rareItemsFound40K",
    l: "40,000个稀有道具被找到",
    m: 20,
    j: 4E4,
    h: 14
},
{
    k: "rareItemsFound60K",
    l: "60,000个稀有道具被找到",
    m: 20,
    j: 6E4,
    h: 16
},
{
    k: "rareItemsFound80K",
    l: "80,000个稀有道具被找到",
    m: 20,
    j: 8E4,
    h: 13
},
{
    k: "rareItemsFound100K",
    l: "100,000个稀有道具被找到",
    m: 20,
    j: 1E5,
    h: 15
},
{
    k: "historicItemsFound10",
    l: "10个历史道具被找到",
    m: 21,
    j: 10,
    h: 15
},
{
    k: "historicItemsFound25",
    l: "25个历史道具被找到",
    m: 21,
    j: 25,
    h: 7
},
{
    k: "historicItemsFound50",
    l: "50个历史道具被找到",
    m: 21,
    j: 50,
    h: 15
},
{
    k: "historicItemsFound100",
    l: "100个历史道具被找到",
    m: 21,
    j: 100,
    h: 8
},
{
    k: "historicItemsFound250",
    l: "250个历史道具被找到",
    m: 21,
    j: 250,
    h: 15
},
{
    k: "historicItemsFound500",
    l: "500个历史道具被找到",
    m: 21,
    j: 500,
    h: 6
},
{
    k: "historicItemsFound1000",
    l: "1,000个历史道具被找到",
    m: 21,
    j: 1E3,
    h: 15
},
{
    k: "historicItemsFound1500",
    l: "1,500个历史道具被找到",
    m: 21,
    j: 1500,
    h: 2
},
{
    k: "historicItemsFound2K",
    l: "2,000个历史道具被找到",
    m: 21,
    j: 2E3,
    h: 15
},
{
    k: "historicItemsFound3K",
    l: "3,000个历史道具被找到",
    m: 21,
    j: 3E3,
    h: 18
},
{
    k: "historicItemsFound4K",
    l: "4,000个历史道具被找到",
    m: 21,
    j: 4E3,
    h: 15
},
{
    k: "historicItemsFound5K",
    l: "5,000个历史道具被找到",
    m: 21,
    j: 5E3,
    h: Ld
},
{
    k: "historicItemsFound6K",
    l: "6,000个历史道具被找到",
    m: 21,
    j: 6E3,
    h: 21
},
{
    k: "historicItemsFound7K",
    l: "7,000个历史道具被找到",
    m: 21,
    j: 7E3,
    h: 8
},
{
    k: "historicItemsFound8K",
    l: "8,000个历史道具被找到",
    m: 21,
    j: 8E3,
    h: 7
},
{
    k: "ancientItemsFound3",
    l: "3个远古道具被找到",
    m: 22,
    j: 3,
    h: 16
},
{
    k: "ancientItemsFound10",
    l: "10个远古道具被找到",
    m: 22,
    j: 10,
    h: 1
},
{
    k: "ancientItemsFound25",
    l: "25个远古道具被找到",
    m: 22,
    j: 25,
    h: 16
},
{
    k: "ancientItemsFound50",
    l: "50个远古道具被找到",
    m: 22,
    j: 50,
    h: 2
},
{
    k: "ancientItemsFound75",
    l: "75个远古道具被找到",
    m: 22,
    j: 75,
    h: 16
},
{
    k: "ancientItemsFound100",
    l: "100个远古道具被找到",
    m: 22,
    j: 100,
    h: 17
},
{
    k: "ancientItemsFound150",
    l: "150个远古道具被找到",
    m: 22,
    j: 150,
    h: 16
},
{
    k: "ancientItemsFound200",
    l: "200个远古道具被找到",
    m: 22,
    j: 200,
    h: Ld
},
{
    k: "ancientItemsFound300",
    l: "300个远古道具被找到",
    m: 22,
    j: 300,
    h: 16
},
{
    k: "ancientItemsFound400",
    l: "400个远古道具被找到",
    m: 22,
    j: 400,
    h: 9
},
{
    k: "ancientItemsFound500",
    l: "500个远古道具被找到",
    m: 22,
    j: 500,
    h: 12
},
{
    k: "ancientItemsFound600",
    l: "600个远古道具被找到",
    m: 22,
    j: 600,
    h: 11
},
{
    k: "ancientItemsFound700",
    l: "700个远古道具被找到",
    m: 22,
    j: 700,
    h: 10
},
{
    k: "ancientItemsFound800",
    l: "800个远古道具被找到",
    m: 22,
    j: 800,
    h: 9
},
{
    k: "reducedPartyVictory1",
    l: "使用1个冒险者获得胜利",
    m: 23,
    j: 1,
    h: Ld,
    ab: !0
},
{
    k: "reducedPartyVictory2",
    l: "使用2个冒险者获得胜利",
    m: 23,
    j: 2,
    h: 19,
    ab: !0
},
{
    k: "reducedPartyVictory3",
    l: "使用3个冒险者获得胜利",
    m: 23,
    j: 3,
    h: 21,
    ab: !0
},
{
    k: "singleClassVictory",
    l: "使用4个同职业冒险者获得胜利",
    m: 24,
    j: 1,
    h: 22,
    ab: !0
},
{
    k: "barbarianVictory",
    l: "使用野蛮人获得胜利",
    m: 25,
    Hb: 1,
    j: 1,
    h: 16,
    ab: !0
},
{
    k: "fighterVictory",
    l: "使用战士获得胜利",
    m: 25,
    Hb: 0,
    j: 1,
    h: 15,
    ab: !0
},
{
    k: "priestVictory",
    l: "使用牧师获得胜利",
    m: 25,
    Hb: 6,
    j: 1,
    h: 14,
    ab: !0
},
{
    k: "rangerVictory",
    l: "使用游侠获得胜利",
    m: 25,
    Hb: 2,
    j: 1,
    h: 13,
    ab: !0
},
{
    k: "druidVictory",
    l: "使用德鲁伊获得胜利",
    m: 25,
    Hb: 10,
    j: 1,
    h: 8,
    ab: !0
},
{
    k: "rogueVictory",
    l: "使用盗贼获得胜利",
    m: 25,
    Hb: 7,
    j: 1,
    h: 6,
    ab: !0
},
{
    k: "pyromancerVictory",
    l: "使用火法师获得胜利",
    m: 25,
    Hb: 4,
    j: 1,
    h: 7,
    ab: !0
},
{
    k: "electromancerVictory",
    l: "使用电法师获得胜利",
    m: 25,
    Hb: 3,
    j: 1,
    h: 12,
    ab: !0
},
{
    k: "necromancerVictory",
    l: "使用死灵法师获得胜利",
    m: 25,
    Hb: 9,
    j: 1,
    h: 11,
    ab: !0
},
{
    k: "chickenKingVictory",
    l: "使用鸡王获得胜利",
    m: 25,
    Hb: 11,
    j: 1,
    h: 9,
    ab: !0
},
{
    k: "ninjaVictory",
    l: "使用忍者获得胜利",
    m: 25,
    Hb: 8,
    j: 1,
    h: 2,
    ab: !0
},
{
    k: "continuationVictory1",
    l: "延续胜利",
    m: 26,
    j: 1,
    h: 10,
    ab: !0
},
{
    k: "continuationVictory2",
    l: "第二次延续胜利",
    m: 26,
    j: 2,
    h: Ld,
    ab: !0
},
{
    k: "continuationVictory3",
    l: "第三次延续胜利",
    m: 26,
    j: 3,
    h: 22,
    ab: !0
},
{
    k: "continuationVictory4",
    l: "第四次延续胜利",
    m: 26,
    j: 4,
    h: 2,
    ab: !0
},
{
    k: "soloBarbarianVictory",
    l: "单独使用野蛮人获得胜利",
    m: 27,
    Hb: 1,
    j: 1,
    h: 22,
    ab: !0
},
{
    k: "soloFighterVictory",
    l: "单独使用战士获得胜利",
    m: 27,
    Hb: 0,
    j: 1,
    h: 1,
    ab: !0
},
{
    k: "soloPriestVictory",
    l: "单独使用牧师获得胜利",
    m: 27,
    Hb: 6,
    j: 1,
    h: 13,
    ab: !0
},
{
    k: "soloRangerVictory",
    l: "单独使用游侠获得胜利",
    m: 27,
    Hb: 2,
    j: 1,
    h: 14,
    ab: !0
},
{
    k: "soloDruidVictory",
    l: "单独使用德鲁伊获得胜利",
    m: 27,
    Hb: 10,
    j: 1,
    h: 15,
    ab: !0
},
{
    k: "soloRogueVictory",
    l: "单独使用盗贼获得胜利",
    m: 27,
    Hb: 7,
    j: 1,
    h: 16,
    ab: !0
},
{
    k: "soloPyromancerVictory",
    l: "单独使用火法师获得胜利",
    m: 27,
    Hb: 4,
    j: 1,
    h: 21,
    ab: !0
},
{
    k: "soloElectromancerVictory",
    l: "单独使用电法师获得胜利",
    m: 27,
    Hb: 3,
    j: 1,
    h: Pd,
    ab: !0
},
{
    k: "soloNecromancerVictory",
    l: "单独使用死灵法师获得胜利",
    m: 27,
    Hb: 9,
    j: 1,
    h: 19,
    ab: !0
},
{
    k: "soloChickenKingVictory",
    l: "单独使用鸡王获得胜利",
    m: 27,
    Hb: 11,
    j: 1,
    h: Ld,
    ab: !0
},
{
    k: "soloNinjaVictory",
    l: "单独使用忍者获得胜利",
    m: 27,
    Hb: 8,
    j: 1,
    h: 17,
    ab: !0
}];
function Wr(a) {
    this.Of = this.We = !1;
    this.k = a.k;
    this.l = a.l;
    this.m = a.m;
    this.j = a.j;
    this.Hb = a.Hb;
    this.h = a.h;
    this.Vt = Pr[a.h].yc;
    this.ab = !!a.ab;
    this.Rt = this.Pt = null
}
function Xr(a) {
    a.Pt || (a.Pt = "+" + a.Vt + "成就点每" + Pr[a.h].Fc);
    return a.Pt
}
function Yr(a) {
    a.Rt || (a.Rt = Zr(a));
    return a.Rt
}
function $r(a) {
    if (!a.We || a.Of) console.log("not applying achievement bonus. obtained=" + a.We + " applied=" + a.Of);
    else {
        Tr(a.h, a.Vt);
        a.Of = !0;
        var b = w.i.Ig,
        c = b.Ze.indexOf(a); - 1 < c && b.Ze.splice(c, 1);
        Ta("Achievement", a.l)
    }
}
function as(a) {
    var b = w.i.Bg;
    switch (a.m) {
    case 23:
        return 1 === a.j ? 0 < b.hn: 2 === a.j ? 0 < b.jn: 3 === a.j ? 0 < b.kn: !1;
    case 24:
        return 0 < b.vn;
    case 25:
        return 0 < bs(b, a.Hb);
    case 26:
        return b.Xm >= a.j;
    case 27:
        return 0 < cs(b, a.Hb);
    default:
        return ! 1
    }
}
function ds(a) {
    var b = w.i.Ua;
    switch (a.m) {
    case 1:
        return b.si;
    case 2:
        return b.Dl;
    case 3:
        return b.El;
    case 4:
        return b.ul;
    case 5:
        return b.Nl;
    case 6:
        return b.Sl;
    case 7:
        return b.tk;
    case 8:
        return b.Ph;
    case 9:
        return b.Rk;
    case 10:
        return b.wi;
    case 11:
        return b.uk;
    case 12:
        return b.Gl;
    case 13:
        return b.hl;
    case 14:
        return b.wl;
    case 15:
        return b.kl;
    case 16:
        return ci(w.i.da);
    case 17:
        return b.Lk;
    case 18:
        return b.Gi;
    case 19:
        return b.Ol;
    case 20:
        return b.xl;
    case 21:
        return b.Zk;
    case 22:
        return b.nk;
    case 28:
        return b.Ff
    }
}
function Zr(a) {
    switch (a.m) {
    case 1:
        return "杀点什么";
    case 2:
        return "使用更多卷轴";
    case 3:
        return "使用很多卷轴";
    case 4:
        return "嗑药";
    case 5:
        return "打开财宝箱";
    case 6:
        return "搜索武器架";
    case 7:
        return "搜索书架";
    case 8:
        return "卖出道具";
    case 9:
        return "购买农场";
    case 10:
        return "清理地牢";
    case 11:
        return "征服城堡";
    case 12:
        return "施放法术";
    case 13:
        return "用剑攻击";
    case 14:
        return "用弓攻击";
    case 15:
        return "召唤宠物";
    case 16:
        return "等级提升";
    case 17:
        return "探索地牢";
    case 18:
        return "找到道具";
    case 19:
        return "找到好点的道具";
    case 20:
        return "找到好的道具";
    case 21:
        return "找到很好的道具";
    case 22:
        return "找到极好的道具";
    case 23:
        return "使用小型队伍进行游戏";
    case 24:
        return "使用多余的队伍进行游戏";
    case 25:
        return "用不同的职业进行游戏";
    case 26:
        return "不进行重生";
    case 27:
        return "单人队伍";
    case 28:
        return "使用召唤者"
    }
};
function es() {
    var a = w.i.Ig,
    b;
    for (b = 0; b < a.jj.length; b++) {
        var c = a.jj[b];
        c.Of = !1;
        c.We = !1
    }
    a.ik.length = 0;
    a.Ze.length = 0
};
var Pi = 5;
function fs() {
    this.FC = -100;
    this.Wp = null;
    this.EC = !1;
    this.Iw = 0
}
e = fs.prototype;
e.sx = function() {};
e.Oc = function() {
    return ! 0
};
e.qc = function() {
    return ! 1
};
e.Wo = function() {
    return null
};
e.Pz = function() {
    return null
};
e.ib = function() {
    return "upgrade title"
};
e.og = function() {};
e.He = function() {
    return ! 1
};
e.Na = function() {
    return null
};
e.uw = function() {
    return null
};
e.Vo = function() {
    return null
};
e.Kr = function() {
    return 1
};
e.Nz = function() {
    return null
};
e.us = function() {};
e.Qc = function() {};
e.lb = function() {};
e.Oz = function() {
    return null
};
e.Bb = function() {
    return 0
};
function gs(a) {
    w.i.Gj != a.FC && (a.FC = w.i.Gj, a.EC = a.Cd());
    return a.EC
}
e.Cd = function() {
    return ! 1
};
function hs(a) {
    a.Iw = w.i.Gj
};
function is(a, b) {
    this.HC = a;
    var c, d, f, g = [];
    for (c = 0; c < a.length; c++) for (f = a[c], d = 0; d < f.length; d++) g.push(f[d]);
    this.Ha = g;
    if (b) for (c = [], d = 0; d < this.Ha.length; d++) c.push(null);
    else c = null;
    this.Eq = c;
    this.mj = 0;
    this.JE = b;
    this.cx = 0
}
function js(a) {
    var b;
    for (b = 0; b < a.Ha.length; b++) a.Ha[b].og();
    a.mj = 0;
    a.cx = w.i.Gj - 1
}
function ks(a) {
    var b, c, d;
    for (b = 0; b < a.HC.length; b++) for (d = a.HC[b], c = 0; c < d.length; c++) d[c].us();
    a.mj = 0
}
function ls(a) {
    var b, c = !1,
    d;
    for (b = 0; b < a.Ha.length; b++)(d = gs(a.Ha[b])) && (c = !0);
    if (c) {
        if (a.JE) {
            d = 0;
            var f = a.cx;
            for (b = 0; b < a.Ha.length; b++) c = a.Ha[b],
            c.qc() && c.Iw < f && (a.Eq[d++] = c);
            for (b = 0; b < a.Ha.length; b++) c = a.Ha[b],
            c.qc() && c.Iw >= f && (a.Eq[d++] = c);
            for (b = 0; b < a.Ha.length; b++) c = a.Ha[b],
            c.qc() || (a.Eq[d++] = c);
            b = a.Ha;
            a.Ha = a.Eq;
            a.Eq = b;
            a.cx = w.i.Gj
        }
        a.mj++
    }
};
function ms(a) {
    this.Ly = a;
    this.xc = null;
    this.jk = "计划攻击";
    this.Up = this.Ub = this.Ea = this.A = !1
}
ms.prototype = new fs;
e = ms.prototype;
e.Oc = function() {
    return this.A || this.Ea
};
e.qc = function() {
    return this.A
};
e.lb = function() {
    return this.jk
};
e.ib = function() {
    return "攻击城堡"
};
e.He = function() {
    return this.xc && (this.xc.ye || this.xc.cb)
};
e.Na = function() {
    return 13
};
e.Qc = function() {
    this.xc && (Ta("Castle", "计划攻击:" + this.xc.mi), this.xc.ye = !0, Lc(), nd(this.xc), Pc(this.xc), this.A = !1, this.xc = null, hs(this))
};
e.Cd = function() {
    var a;
    a = w.kb.Jg; (a = this.Ly < a.length ? a[this.Ly] : null) ? (this.A = w.ob.fc >= a.Jf, this.Ea = !this.A) : this.Ea = this.A = !1;
    var b = this.xc != a || this.Ub != this.A || this.Up != this.Ea;
    b && a && (this.jk = this.A ? a.mi: "需要怪物等级: " + a.Jf);
    this.xc = a;
    this.Ub = this.A;
    this.Up = this.Ea;
    return b
};
function ns(a) {
    this.mb = a;
    this.A = this.Ea = !1;
    this.$A = -1;
    this.Zj = this.Ub = this.$j = !1;
    os(this)
}
ns.prototype = new fs;
e = ns.prototype;
e.us = function() {
    0 < this.mb.md && os(this)
};
e.og = function() {
    this.mb.md = 0;
    os(this)
};
e.ib = function() {
    return this.mb.title
};
e.Na = function() {
    return 1
};
e.Oc = function() {
    return this.A || this.Ea
};
e.qc = function() {
    return this.A
};
e.Qc = function() {
    this.mb.rd > w.i.da.Je || (ps(w.i.da, this.mb.rd), this.mb.md++, this.A = !1, os(this), hs(this), Ta("Upgrade", this.mb.title + " 数值:" + this.mb.t))
};
e.Bb = function() {
    return this.mb.rd
};
e.lb = function() {
    return this.mb.e
};
function os(a) {
    a.mb.rd = Ia(a.mb.ah + a.mb.md * a.mb.Pg, qs, 1);
    a.mb.t = a.mb.xf + a.mb.md * a.mb.$g;
    a.mb.t > a.mb.maxValue && (a.mb.t = a.mb.maxValue)
}
e.Cd = function() {
    this.mb.t >= this.mb.maxValue ? this.Ea = this.A = !1 : (this.A = this.mb.rd <= w.i.da.Je, this.Ea = !this.A && this.hu());
    var a = this.Oc(),
    b = this.$A !== this.mb.md || this.Ub !== this.A || this.Zj !== this.Ea || this.$j !== a;
    this.$A = this.mb.md;
    this.Ub = this.A;
    this.Zj = this.Ea;
    this.$j = a;
    return b
};
e.hu = function() {
    var a = w.i.da.Je;
    if (a >= this.mb.rd) return ! 1;
    a = this.mb.rd - a;
    return 400 >= a || a <= 0.3 * this.mb.rd
};
function rs(a) {
    this.vh = !1;
    this.Yz = -1;
    this.e = "";
    this.vp = a
}
rs.prototype = new fs;
e = rs.prototype;
e.Wo = function() {
    return null
};
e.Nz = function() {
    return w.Di.Fj
};
e.ib = function() {
    return "装备所有道具"
};
e.Na = function() {
    return 4
};
e.lb = function() {
    return this.e
};
e.Qc = function() {
    var a = w.Di,
    b;
    for (b = 0; b < w.i.D.length; b++) a.Br(w.i.D[b]);
    hs(this)
};
e.Oc = function() {
    return this.vh
};
e.qc = function() {
    return this.vh
};
e.Cd = function() {
    var a, b = 0;
    for (a = 0; a < w.i.D.length; a++) {
        var c;
        c = w.i.D[a];
        var d = c.Ld.items;
        if (d && 0 !== d.length) {
            for (var f = void 0,
            g = void 0,
            h = void 0,
            l = 0,
            f = 0; f < d.length; f++) g = d[f],
            (h = c.ef(g.r)) && !ss(g, h) || l++;
            c = l
        } else c = 0;
        b += c
    }
    a = b;
    b = a > this.vp;
    if (c = this.vh !== b || this.Yz !== a) this.e = "装备所有更好的道具(" + a + ")";
    this.vh = b;
    this.Yz = a;
    return c
};
function ts(a, b) {
    this.vh = !1;
    this.hA = a;
    this.e = this.item = null;
    this.vp = b
}
ts.prototype = new fs;
e = ts.prototype;
e.Wo = function() {
    return null
};
e.og = function() {
    this.e = this.item = null
};
e.Oz = function() {
    return this.item
};
e.Na = function() {
    return 3
};
e.lb = function() {
    return this.e
};
e.Qc = function() {
    var a = this.item.nj;
    a && (a.Qk(this.item), hs(this))
};
e.Oc = function() {
    return this.vh
};
e.qc = function() {
    return this.vh
};
e.Cd = function() {
    var a = w.Di.Fj,
    b = this.vh,
    c = this.item;
    a.length <= this.vp && a.length > this.hA ? (this.item = a[this.hA], c != this.item && (this.e = "Equip " + this.item.Ew), this.vh = !0) : (this.e = this.item = null, this.vh = !1);
    return b != this.vh || c != this.item
};
function us(a) {
    this.ZA = this.Up = this.A = this.Ea = !1;
    this.WA = -1;
    this.e = null;
    this.Lo = 0;
    this.$ = a
}
us.prototype = new fs;
e = us.prototype;
e.og = function() {
    this.e = null
};
e.Vo = function() {
    return this.$ >= w.i.D.length ? null: w.i.D[this.$]
};
e.Na = function() {
    return 2
};
e.lb = function() {
    return this.e
};
e.Qc = function() {
    if (! (this.$ >= w.i.D.length)) {
        this.A = !1;
        var a = w.i.D[this.$],
        b = a.K,
        c = b.Am,
        d = vs();
        if (! (w.i.da.cg < c)) {
            var f = w.i.da;
            f.cg -= c;
            0 > f.cg && (f.cg = 0);
            c = b.Eb + 1;
            ji(b, c, a.Kc.Ma);
            a.de++;
            a.Zi = ws(a);
            b.Eb = c;
            if ((b = a.yg) && 0 < b.length) for (f = 0; f < b.length; f++) {
                var g = b[f],
                h = c;
                g.K.Eb = h;
                ji(g.K, h, g.Kc.Ma);
                ii(g, h)
            }
            xs();
            b = vs();
            d !== b && (d = w.i.ce, b = d.K, f = vs(), ii(d, f), ji(b, f, d.Kc.Ma), b.Eb = f);
            Kd(22);
            Ta("Adventurer", "升级" + a.Kc.Ka + ": " + c)
        }
        hs(this)
    }
};
e.hu = function() {
    var a = w.i.da.cg,
    b = w.i.D[this.$].K.Am;
    if (a >= b) return ! 1;
    a = b - a;
    return 300 >= a ? !0 : a <= 0.2 * b
};
e.Oc = function() {
    return this.A || this.Ea
};
e.Bb = function() {
    return this.Lo
};
e.qc = function() {
    return this.A
};
e.Cd = function() {
    if (this.$ >= w.i.D.length) this.Ea = this.A = !1;
    else {
        var a = w.i.D[this.$];
        this.e || (this.e = "升级" + a.Xt);
        this.Lo = a.K.Am;
        this.A = w.i.da.cg >= this.Lo;
        this.Ea = !this.A && this.hu();
        a = this.ZA !== this.A || this.Up !== this.Ea || this.WA !== this.Lo;
        this.ZA = this.A;
        this.Up = this.Ea;
        this.WA = this.Lo;
        return a
    }
};
function ys() {
    this.qe = -1;
    this.Ds = 1;
    this.Ql = this.A = !1;
    this.Ve = "解锁怪物等级"
}
ys.prototype = new fs;
e = ys.prototype;
e.us = function() {
    this.Ql || (this.Ql = !0, this.qe = w.ob.fc + 1, this.Ds = Ia(this.qe, zs, 1), this.Ve = "解锁怪物等级" + this.qe)
};
e.Kr = function() {
    return this.qe
};
e.og = function() {
    this.Ql = !1;
    this.qe = w.ob.fc + 1;
    this.Ds = Ia(this.qe, zs, 1);
    this.Ve = "解锁怪物等级" + this.qe
};
e.ib = function() {
    return this.Ve
};
e.Na = function() {
    return 11
};
e.lb = function() {
    return ""
};
e.Qc = function() {
    if (this.A) {
        ps(w.i.da, this.Bb());
        var a = w.ob;
        a.fc = Math.max(a.fc, this.qe);
        this.A = !1;
        hs(this);
        Ta("Monster Level", "解锁等级" + this.qe)
    }
};
e.Oc = function() {
    return ! 0
};
e.Bb = function() {
    return m(this.Ds * As.t)
};
e.qc = function() {
    return this.A
};
e.Cd = function() {
    var a = this.A,
    b = this.qe,
    c = w.ob.fc + 1;
    this.qe != c && (this.qe = c, this.Ds = Ia(this.qe, zs, 1), this.Ve = "解锁怪物等级" + this.qe);
    if (c = w.i.da.Je >= this.Bb()) if (c = vs() >= this.qe) c = w.ob,
    c = 1 + c.fc - c.hd < Bs;
    this.A = c;
    return a !== this.A || b !== this.qe
};
function Cs() {
    this.Yd = -1;
    this.Cs = 1;
    this.Ql = this.Ea = this.A = !1;
    this.Ve = "退休怪物等级"
}
Cs.prototype = new fs;
e = Cs.prototype;
e.us = function() {
    this.Ql || (this.Ql = !0, this.Yd = w.ob.hd, this.Cs = Ia(this.Yd, zs, 1), this.Ve = "退休怪物等级" + this.Yd)
};
e.Kr = function() {
    return this.Yd
};
e.og = function() {
    this.Ql = !1;
    this.Yd = w.ob.hd;
    this.Cs = Ia(this.Yd, zs, 1);
    this.Ve = "退休怪物等级" + this.Yd
};
e.ib = function() {
    return this.Ve
};
e.Na = function() {
    return 11
};
e.lb = function() {
    return ""
};
e.Qc = function() {
    if (this.A) {
        ps(w.i.da, this.Bb());
        var a = this.Yd,
        b = w.ob;
        a >= b.fc ? console.log("setMonsterLevelRetired attempt to retire max level") : a < b.hd ? console.log("setMonsterLevelRetired attempt to retire previously retired level") : a > b.hd ? console.log("setMonsterLevelRetired attempt to retire non-min level") : (b.hd++, delete b.en[a + ""]);
        this.A = !1;
        hs(this);
        Ta("Monster Level", "退休等级" + this.Yd)
    }
};
e.Oc = function() {
    return this.A || this.Ea
};
e.Bb = function() {
    return m(this.Cs * As.t)
};
e.qc = function() {
    return this.A
};
e.Cd = function() {
    var a = this.A,
    b = this.Ea,
    c = this.Yd;
    this.Yd != w.ob.hd && (this.Yd = w.ob.hd, this.Cs = Ia(this.Yd, zs, 1), this.Ve = "退休怪物等级" + this.Yd);
    this.Yd < vs() && this.Yd < w.ob.fc - 1 ? (this.A = w.i.da.Je >= this.Bb(), this.Ea = !this.A) : this.Ea = this.A = !1;
    return a != this.A || b != this.Ea || c != this.Yd
};
function F(a) {
    this.it = a;
    this.Zb = null;
    this.Hc = this.A = !1
}
F.prototype = new fs;
e = F.prototype;
e.sx = function(a) {
    this.Zb = a
};
e.Jr = function() {
    return this.it
};
e.He = function() {
    return this.Hc
};
e.ft = function(a) {
    this.Hc = a
};
e.og = function() {
    this.Zb = null;
    this.Hc = !1
};
e.Vo = function() {
    return this.Zb
};
e.ib = function() {
    return this.it.title
};
e.Bb = function() {
    return 1
};
e.lb = function() {
    return this.it.e
};
e.Na = function() {
    return Pi
};
e.Oc = function() {
    return ! 0
};
e.qc = function() {
    return this.A
};
e.Qc = function() {
    if (!this.Hc) if (!this.Zb) console.log("error: adventurer not assigned to skill upgrade");
    else if (! (1 > this.Zb.de)) {
        this.Hc = !0;
        var a = this.Zb;
        a.de--;
        0 > a.de && (a.de = 0);
        a.Zi = ws(a);
        Mi(this.Zb);
        hs(this);
        Ta("Skill", this.Zb.Kc.Ka + " " + this.it.title)
    }
};
e.Cd = function() {
    if (this.Zb) {
        var a = this.A;
        this.A = !this.Hc && (!this.Wp || this.Wp.He()) && 0 < this.Zb.de;
        return a !== this.A
    }
    console.log("error: adventurer not assigned to skill upgrade")
};
function Ds(a) {
    this.oq = a;
    this.Zb = null;
    this.Hc = this.A = !1;
    this.zd = null
}
Ds.prototype = new fs;
e = Ds.prototype;
e.sx = function(a) {
    this.Zb = a
};
e.Jr = function() {
    return this.oq
};
e.He = function() {
    return this.Hc
};
e.ft = function(a) {
    this.Hc = a
};
e.og = function() {
    this.Zb = null;
    this.Hc = !1;
    this.zd = null
};
e.uw = function() {
    this.zd || (this.zd = new li(this.oq.xa));
    return this.zd
};
e.Vo = function() {
    return this.Zb
};
e.ib = function() {
    return this.oq.xa.ta
};
e.Bb = function() {
    return 1
};
e.lb = function() {
    return this.oq.xa.description
};
e.Na = function() {
    return 6
};
e.Oc = function() {
    return ! 0
};
e.qc = function() {
    return this.A
};
e.Qc = function() {
    if (!this.Hc) if (this.Zb) {
        var a = this.Zb.Ci;
        1 > this.Zb.de && 1 > a || (this.Hc = !0, a = this.Zb, 0 < a.Ci ? a.Ci = 0 : (a.de--, 0 > a.de && (a.de = 0)), a.Zi = ws(a), ki(this.Zb, this.uw()), hs(this), Ta("Spell", this.Zb.Kc.Ka + " " + this.oq.xa.ta))
    } else console.log("error: adventurer not assigned to spell upgrade")
};
e.Cd = function() {
    if (this.Zb) {
        var a = this.A,
        b = this.Zb.de,
        c = this.Zb.Ci;
        this.A = !this.Hc && (!this.Wp || this.Wp.He()) && (0 < b || c);
        return a !== this.A
    }
    console.log("error: adventurer not assigned to spell upgrade: " + this.ib())
};
function Es(a) {
    this.ua = a;
    this.Zj = this.Ub = this.$j = this.A = this.Ea = !1
}
Es.prototype = new fs;
e = Es.prototype;
e.Wo = function() {
    return this.ua
};
e.ct = function(a) {
    this.ua = a
};
e.Oc = function() {
    return this.A || this.Ea
};
e.qc = function() {
    return this.A
};
e.lb = function() {
    if (this.ua && !Hd(this.ua)) {
        if (this.ua.oe) return "收获地牢";
        if (!this.ua.zj.cb) return "先要征服城堡"
    }
    return "购买地牢农场"
};
e.ib = function() {
    return "地牢农场"
};
e.He = function() {
    return this.ua && this.ua.oe
};
e.Na = function() {
    return 7
};
e.Bb = function() {
    return this.ua ? m(this.ua.Nk * ce.t) : 0
};
e.Qc = function() {
    w.i.da.fd < this.Bb() || (Fs(this.ua, this.Bb()), hs(this))
};
e.Cd = function() {
    var a = Hd(this.ua);
    this.A = a && w.i.da.fd >= this.Bb();
    this.Ea = a && !this.A && 120 > this.Bb() - w.i.da.fd;
    var a = this.Oc(),
    b = this.Ub !== this.A || this.Zj !== this.Ea || this.$j !== a;
    this.Ub = this.A;
    this.Zj = this.Ea;
    this.$j = a;
    return b
};
function Gs(a) {
    this.Ez = a;
    this.ua = null;
    this.Zj = this.Ub = this.$j = this.A = this.Ea = !1
}
Gs.prototype = new fs;
e = Gs.prototype;
e.Wo = function() {
    return this.ua
};
e.Oc = function() {
    return this.A || this.Ea
};
e.qc = function() {
    return this.A
};
e.lb = function() {
    return "购买地牢农场"
};
e.ib = function() {
    return "购买怪物农场"
};
e.He = function() {
    return this.ua && this.ua.oe
};
e.Na = function() {
    return 8
};
e.Bb = function() {
    return this.ua ? m(this.ua.Nk * ce.t) : 0
};
e.Qc = function() { ! this.ua || w.i.da.fd < this.Bb() || (this.A = !1, Fs(this.ua, this.Bb()), hs(this))
};
e.Cd = function() {
    var a;
    a = w.Aa.bk; (a = this.Ez < a.length ? a[this.Ez] : null) ? a.zj.cb ? (this.A = w.i.da.fd >= this.Bb(), this.Ea = !this.A) : this.Ea = this.A = !1 : this.Ea = this.A = !1;
    var b = this.Oc(),
    c = this.ua != a || this.Ub != this.A || this.Zj != this.Ea || this.$j != b;
    this.ua = a;
    this.Ub = this.A;
    this.Zj = this.Ea;
    this.$j = b;
    return c
};
function Hs() {
    this.Ub = this.A = !1
}
Hs.prototype = new fs;
e = Hs.prototype;
e.Oc = function() {
    return this.A
};
e.qc = function() {
    return this.A
};
e.lb = function() {
    return "收集农场杀戮"
};
e.ib = function() {
    return "收获奖励"
};
e.Na = function() {
    return 9
};
e.Qc = function() {
    Ta("Dungeon", "农场已收获");
    var a = w.Aa.Sd;
    w.i.aa.Wr(a);
    Is(a);
    w.Aa.dt(0);
    this.A = !1;
    hs(this)
};
e.Cd = function() {
    this.A = 0 < w.Aa.Sd;
    var a = this.Ub !== this.A;
    this.Ub = this.A;
    return a
};
function Js(a) {
    this.qg = a;
    this.Ea = this.A = !1;
    this.scroll = null
}
Js.prototype = new fs;
e = Js.prototype;
e.og = function() {
    this.scroll = null;
    this.Ea = this.A = !1
};
e.vf = function() {
    this.scroll || (this.scroll = w.nh.vf(this.qg));
    return this.scroll
};
e.Pz = function() {
    return this.vf()
};
e.ib = function() {
    return this.vf().lx
};
e.Bb = function() {
    return this.vf().rn
};
e.lb = function() {
    return this.vf().Qe ? "解锁卷轴": "升级卷轴"
};
e.Na = function() {
    return 12
};
e.Oc = function() {
    return this.A || this.Ea
};
e.qc = function() {
    return this.A
};
e.Qc = function() {
    var a = this.vf(),
    b = a.rn;
    if (! (w.i.da.fd < b)) {
        Ks(b);
        a: {
            if (a.Qe) a.Qe = !1,
            Fq(w.nh, a),
            Ta("Scroll Unlock", a.rg);
            else {
                if (a.tg >= a.Qh) break a;
                a.tg++;
                a.tn && (Qi(w.i.ce, a.tn.f, a.tn.g), Gq());
                Ta("Scroll Upgrade", a.rg + " (数量=" + a.tg + ")")
            }
            a.rg = zq(a);
            a.lx = Aq(a);
            a.rn = yq(a)
        }
        hs(this);
        this.A = !1
    }
};
e.Cd = function() {
    var a = this.vf(),
    b = this.A,
    c = w.i.ce.K.Eb,
    d = a.Qe ? a.sg: a.sg + (a.tg + 1) * a.Yi;
    a.Qe ? (this.A = c >= d && w.i.da.fd >= a.rn, this.Ea = !this.A && c >= d) : (this.A = a.tg < a.Qh && c >= d && w.i.da.fd >= a.rn, this.Ea = !this.A && a.tg < a.Qh && c >= d);
    return b !== this.A
};
function Ls(a) {
    this.vy = a;
    this.Ic = null;
    this.Ve = "Achievement";
    this.jk = "Reward";
    this.Ub = this.A = !1
}
Ls.prototype = new fs;
e = Ls.prototype;
e.He = function() {
    return this.Ic ? this.Ic.Of: !1
};
e.ib = function() {
    return this.Ve
};
e.lb = function() {
    return this.jk
};
e.Na = function() {
    return 14
};
e.Oc = function() {
    return this.A
};
e.qc = function() {
    return this.A
};
e.Qc = function() {
    this.Ic && ($r(this.Ic), this.Ic = null, this.A = !1, hs(this))
};
e.Cd = function() {
    var a;
    a = w.i.Ig.Ze;
    a = this.vy < a.length ? a[this.vy] : null;
    this.A = null != a;
    var b = this.Ic != a || this.Ub != this.A;
    b && a && (this.Ve = a.l, this.jk = "奖励:" + Xr(a));
    this.Ic = a;
    this.Ub = this.A;
    return b
};
function Ms(a) {
    this.Ic = a;
    this.Ve = this.Ic.We ? this.Ic.l: Yr(this.Ic);
    this.jk = Ns(this);
    this.YA = this.VA = this.A = !1
}
Ms.prototype = new fs;
e = Ms.prototype;
e.He = function() {
    return this.Ic.Of
};
e.ib = function() {
    return this.Ve
};
e.lb = function() {
    return this.jk
};
e.Na = function() {
    return 15
};
e.qc = function() {
    return this.A
};
e.Qc = function() {
    $r(this.Ic);
    this.A = !1;
    hs(this)
};
e.Cd = function() {
    var a = this.Ic.Of,
    b = this.Ic.We;
    this.A = b && !a;
    var c = this.VA != a || this.YA != b;
    c && (this.Ve = this.Ic.We ? this.Ic.l: Yr(this.Ic), this.jk = Ns(this));
    this.VA = a;
    this.YA = b;
    return c
};
function Ns(a) {
    return a.Ic.We ? Xr(a.Ic) : "奖励不明"
};
function Os(a) {
    this.kh = a;
    this.Ub = this.Hc = this.A = !1
}
Os.prototype = new fs;
e = Os.prototype;
e.og = function() {
    this.Hc = this.A = !1;
    this.Ub = !this.A;
    var a = Ps(this);
    a.t = a.defaultValue
};
e.He = function() {
    return this.Hc
};
e.ft = function(a) { (this.Hc = a) && Qs(this)
};
e.ib = function() {
    return this.kh.title
};
e.Na = function() {
    return 16
};
e.qc = function() {
    return this.A
};
e.Qc = function() {
    if (! (this.Hc || this.kh.Gb > w.i.ae.Dd)) {
        var a = this.kh.Gb,
        b = w.i.ae;
        b.An += a;
        b.Dd -= a;
        0 > b.Dd && (b.Dd = 0);
        this.Hc = !0;
        this.A = !1;
        Qs(this);
        hs(this);
        Ta("Points Upgrade", this.kh.title)
    }
};
e.Bb = function() {
    return this.kh.Gb
};
e.lb = function() {
    return this.kh.mc
};
e.Cd = function() {
    this.A = !this.Hc && this.kh.Gb <= w.i.ae.Dd;
    var a = this.Ub !== this.A;
    this.Ub = this.A;
    return a
};
function Qs(a) {
    a = Ps(a);
    a.t += a.lf
}
function Ps(a) {
    switch (a.kh.Tb) {
    case 5:
        return ce;
    case 4:
        return Rs;
    case 3:
        return tr;
    case 1:
        return Dq;
    case 6:
        return As;
    case 2:
        return Ss;
    case 7:
        return Ts;
    case 8:
        return Us;
    case 9:
        return Vs;
    case 10:
        return Ws;
    case 11:
        return Xs;
    case 12:
        return Ys;
    case 13:
        return Zs
    }
    console.log("Failed to find point upgrade setting: " + a.kh.Tb);
    return null
};
function $s() {
    this.Ub = this.A = !1
}
$s.prototype = new fs;
e = $s.prototype;
e.Oc = function() {
    return this.A
};
e.qc = function() {
    return this.A
};
e.lb = function() {
    return "卖出道具获得黄金"
};
e.ib = function() {
    return "收集黄金"
};
e.Na = function() {
    return 10
};
e.Qc = function() {
    Ta("Shop", "Gold Collected");
    var a = w.ug.ni;
    at(a);
    w.i.aa.Yr(a);
    w.ug.ni = 0;
    this.A = !1;
    hs(this)
};
e.Cd = function() {
    this.A = 0 < w.ug.ni;
    var a = this.Ub !== this.A;
    this.Ub = this.A;
    return a
};
var bt = 0,
Vh = 2;
var ct = {
    c: "summonDogSpell",
    xa: sq.LB
},
dt = {
    c: "summonWolfPackSpell",
    xa: sq.PB
},
et = {
    c: "minorHealSpell",
    xa: sq.cE
},
ft = {
    c: "sleepSpell",
    xa: sq.DE
},
gt = {
    c: "summonChickensSpell",
    xa: uq.KB
},
ht = {
    c: "summonGuardChickenSpell",
    xa: uq.MB
},
it = {
    c: "swiftStrikeSpell",
    xa: tq.Hx
},
jt = {
    c: "hurtSpell",
    xa: rq.CD
},
kt = {
    c: "greenDeathSpell",
    xa: rq.xD
},
lt = {
    c: "summonSkeletonArmySpell",
    xa: rq.OB
},
mt = {
    c: "summonPhantomSkullSpell",
    xa: rq.NB
},
nt = {
    c: "tauntSpell",
    xa: oq.ME
},
ot = {
    c: "rageSpell",
    xa: qq.rE
},
pt = {
    c: "sledgeHammerSpell",
    xa: qq.wB
},
qt = {
    c: "stealthSpell",
    xa: pq.IB
},
rt = {
    c: "instantLootSpell",
    xa: pq.ID
},
st = {
    c: "detectTreasureChestSpell",
    xa: pq.wu
},
tt = {
    c: "healSpell",
    xa: nq.yD
},
ut = {
    c: "armorSpell",
    xa: nq.Zz
},
vt = {
    c: "damageSpell",
    xa: nq.FD
},
wt = {
    c: "attackRatingSpell",
    xa: nq.ED
},
xt = {
    c: "defenseRatingSpell",
    xa: nq.$z
},
yt = {
    c: "reviveSpell",
    xa: nq.xE
},
zt = {
    c: "shockSpell",
    xa: kq.sB
},
At = {
    c: "spiderWebSpell",
    xa: kq.CB
},
Bt = {
    c: "lightningRainSpell",
    xa: kq.XD
},
Ct = {
    c: "chainedLightningSpell",
    xa: kq.br
},
Dt = {
    c: "fireBlastSpell",
    xa: lq.rD
},
Et = {
    c: "fireBallSpell",
    xa: lq.Kz
},
Ft = {
    c: "fireRainSpell",
    xa: lq.Lz
},
Gt = {
    c: "turnMonsterSpell",
    xa: lq.TE
};
var Sd = 0,
Kq = 3,
Jq = 4;
function Ht(a, b) {
    if (!b) return ! 1;
    var c = qi(a);
    if (0 === c.length) return ! 1;
    var d;
    for (d = 0; d < c.length; d++) if (a !== c[d] && c[d].p.w === b) return ! 0;
    return ! 1
}
function It(a) {
    var b = qi(a);
    if (0 === b.length) return null;
    var c = a.p.w;
    if (!c) return null;
    var d, f, g = a.p.u,
    h = null,
    l, n = -1;
    for (f = 0; f < b.length; f++)(d = b[f], a === d || d.Va || d.p.w != c || (l = d.Ja, l.wg || d.zb === bt && l.Kd || (l = g.Ud(d.p.u), !(0 > n || l < n)))) || (h = d, n = l);
    return h
}
function Jt(a) {
    var b = a.p.w;
    if (!b) return null;
    var c = qi(a);
    if (0 === c.length) return null;
    var d, f, g = a.p.u,
    h = null,
    l, n = -1;
    for (f = 0; f < c.length; f++)(d = c[f], a === d || d.Va || d.p.w != b || (l = d.Ja, l.wg || l.Kd || l.bi || (l = g.Ud(d.p.u), !(0 > n || l < n)))) || (h = d, n = l);
    return h
}
function Iq(a) {
    var b = Jt(a);
    return b ? b: It(a)
}
function Kt(a) {
    var b;
    b = si(a);
    if (0 === b.length) b = null;
    else {
        var c = a.p.w;
        if (c) {
            var d, f, g = a.p.u,
            h = null,
            l, n = -1;
            for (f = 0; f < b.length; f++)(d = b[f], a === d || d.Va || d.p.w != c || (l = d.Ja, l.wg || l.Kd || l.bi || (l = g.Ud(d.p.u), !(0 > n || l < n)))) || (h = d, n = l);
            b = h
        } else b = null
    }
    if (b) return b;
    c = 0;
    d = si(a);
    if (1 >= d.length) return null;
    for (b = d[k(d.length)]; b === a && 6 > c;) b = d[k(d.length)],
    b.p.w || (b = null),
    c++;
    return b === a ? null: b
}
function Lt(a) {
    var b = It(a);
    return ! b || 100 < a.p.u.ac(b.p.u) ? null: b
}
function Mt(a, b, c) {
    return Math.max(b, (a - b) * (1 - c / 1E3) + b)
}
function Nt(a, b, c) {
    var d = k(w.Nh);
    0.5 > Math.random() && (d = -d);
    var f = k(w.Nh);
    0.5 > Math.random() && (f = -f);
    t(a, b.T + d, b.U + f);
    c && Fg(c, a, 0)
};
function Ot(a, b) {
    var c = w.Cz;
    if (!b) return null;
    var d = a.p.w,
    f = [];
    if (d) {
        var g = d.Nc,
        h;
        for (h = 0; h < g.length; h++) if (d = Pt(c, b, g[h], f, !0)) return d
    } else if (g = a.p.cd, (d = Pt(c, b, g.af, f, !1)) || (d = Pt(c, b, g.Be, f, !1))) return d;
    return null
}
function Qt(a, b) {
    var c = w.Cz;
    if (!b) return null;
    var d = a.p.w,
    f = [];
    if (d === b) return null;
    if (d) {
        var g = d.Nc,
        h;
        for (h = 0; h < g.length; h++) if (d = Rt(c, b, g[h], f, !0)) return d
    } else if (g = a.p.cd, (d = Rt(c, b, g.af, f, !1)) || (d = Rt(c, b, g.Be, f, !1))) return d;
    return null
}
function Pt(a, b, c, d, f) {
    var g;
    if (c === b) return g = [],
    g.push(c),
    g;
    if (!c.Mb) return null;
    if ( - 1 < d.indexOf(c)) return console.log("reached a door that we already checked."),
    null;
    d.push(c);
    if (f) {
        if (f = Lg(c.Yk, c), g = Pt(a, b, f, d, !1)) return g.unshift(c),
        g
    } else {
        var h = c.$d;
        f = h.Nc;
        if (!h.Xi) return null;
        for (h = 0; h < f.length; h++) if (g = f[h], g !== c && (g = Pt(a, b, g, d, !0))) return g.unshift(c),
        g
    }
    return null
}
function Rt(a, b, c, d, f) {
    var g;
    if (c.$d === b) return g = [],
    g.push(c),
    g;
    if (!c.Mb) return null;
    if ( - 1 < d.indexOf(c)) return console.log("reached a door that we already checked [path to room]."),
    null;
    d.push(c);
    if (f) {
        if (f = Lg(c.Yk, c), g = Rt(a, b, f, d, !1)) return g.unshift(c),
        g
    } else {
        var h = c.$d;
        f = h.Nc;
        if (!h.Xi) return null;
        for (h = 0; h < f.length; h++) if (g = f[h], g !== c && (g = Rt(a, b, g, d, !0))) return g.unshift(c),
        g
    }
    return null
};
function Xh(a, b) {
    this.Al = a;
    this.bb = b
}
Xh.prototype.Oa = function() {};
Xh.prototype.dr = function(a) {
    if (!St(this, a) && (a.p.dd || a.Y === Sd)) {
        var b = (this.Al.ja + 1) * w.B,
        c = (this.Al.qb - 1) * w.B;
        t(a.p.Qb, (this.Al.ia + 1) * w.B + k((this.Al.rb - 1) * w.B), b + k(c));
        a.Y = 1;
        a.p.dd = !1
    }
};
function St(a, b) {
    if (hr.t) return ! 1;
    var c = b.Da;
    c && c.Va && (c = null, b.Cb(null));
    c && c.Ja.Kf && (c = null, b.Cb(null));
    c && c.Ja.wg && (c = null, b.Cb(null));
    if (c && c.Ja.Gn) return Tt(a, b),
    !0;
    for (var d = qi(b), f, g = b.p.u, h, l = null, n = -1, c = 0; c < d.length; c++) if (f = d[c], b !== f && (h = f.Ja, h.Gn && !h.Kd && (h = g.Ud(f.p.u), 0 > n || h < n))) l = f,
    n = h;
    return (c = l) || (c = Lt(b)) ? (b.Cb(c), Tt(a, b), !0) : !1
}
function Tt(a, b) {
    var c = b.Da.p,
    d = b.p;
    if (c.w === d.w) {
        if (d.u.ac(c.u) <= a.bb) {
            if (!Ut(b)) return;
            Vt(b);
            b.Y = 2
        } else Nt(d.Qb, c.u, b.p.w),
        b.Y = 1;
        Rd(d)
    }
};
function Wt() {
    this.fo = []
}
Wt.prototype.dr = function(a) {
    w.wb ? this.ou(a) : this.nu(a)
};
Wt.prototype.ou = function(a) {
    var b, c;
    b = w.i.da;
    c = b.Lf;
    var d = b.ge,
    f = b.Wb;
    if (c || f || d) if (a === w.i.gg) {
        if (c) {
            if (b = c.iq, c = c.jq, d = w.S.hb(b, c)) {
                b = a.p;
                w.S.hb(w.S.bc(b.dc()), w.S.cc(b.ec())) === d ? a.Y = 10 : (Xt(b, d.bc(), d.cc()), a.Y = 1);
                return
            }
        } else if (d) {
            if (b = d.dm, c = d.em, d = w.S.hb(b, c)) {
                b = a.p;
                w.S.hb(w.S.bc(b.dc()), w.S.cc(b.ec())) === d ? a.Y = 11 : (Xt(b, d.bc(), d.cc()), a.Y = 1);
                return
            }
        } else if (b = f.bc(), c = f.cc(), d = w.S.hb(b, c)) {
            b = a.p;
            w.S.hb(w.S.bc(b.dc()), w.S.cc(b.ec())) === d ? a.Y = 9 : (Xt(b, d.bc(), d.cc()), a.Y = 1);
            return
        }
        d = a.p;
        if (d.dd || a.Y === Sd) Xt(d, b, c),
        a.Y = 1,
        d.dd = !1
    } else b = Qd(),
    c = b.indexOf(a),
    b = 1 === a.zb ? a.xg: 0 > c ? w.i.gg: b[c - 1],
    Xt(a.p, w.S.bc(b.p.dc()), w.S.cc(b.p.ec())),
    a.Y = 1;
    else a.Y = Sd
};
Wt.prototype.nu = function(a) {
    a.Y = Sd;
    a.rh = null;
    a.Da = null;
    a.bj = null;
    a.Ue = null;
    a.ld = null;
    a.Zh = null;
    a.hk = null;
    var b, c = 0,
    d, f = null,
    g;
    for (b = 0; b < this.fo.length && !(d = this.fo[b], d.Ta() > c && (g = d.wd(a), g > c && (c = g, f = d), 100 <= c)); b++);
    f && f.od(a)
};
Wt.prototype.Oa = function(a) {
    var b;
    for (b = 0; b < this.fo.length; b++) this.fo[b].Oa(a)
};
function Yt(a) {
    this.kB = a;
    this.Al = null
}
e = Yt.prototype;
e.Wa = function() {};
e.Oa = function() {};
e.od = function(a) {
    var b = a.p,
    c = b.w;
    if (c) {
        if (b.dd || this.Al != c) {
            this.Al = c;
            var d = wg(c) + w.B,
            f = (c.qb - 1) * w.B;
            t(b.Qb, ug(c) + w.B + k((c.rb - 1) * w.B), d + k(f));
            b.dd = !1
        }
        a.Y = 1
    }
};
e.wd = function(a) {
    return a.p.w ? this.kB: 0
};
e.Ta = function() {
    return this.kB
};
function Zt() {
    this.ka = 10;
    this.Da = null;
    this.SB = 0;
    this.un = null;
    this.bb = 100;
    this.Yt = !1
}
e = Zt.prototype;
e.Wa = function() {
    this.Da = this.un = null
};
e.Oa = function() {};
e.od = function(a) {
    if (this.Da && this.un) {
        a.Cb(this.Da);
        var b = a.p;
        this.SB = a === this.Da ? 0 : b.u.ac(this.Da.p.u);
        if (this.SB <= this.bb) {
            if (!this.Yt && !Ut(a)) return;
            Vt(a);
            this.un.mq = w.i.$a;
            a.ld = this.un;
            a.Y = Jq;
            this.Kp(a)
        } else ab(b.Qb, this.Da.p.u),
        a.Y = 1;
        Rd(b); (b = a.p.w) && $t(a) && au(b)
    }
};
e.Kp = function() {};
e.wd = function(a) {
    var b = a.p.w;
    if (!b || !this.Wd(a)) return 0;
    if (!fr.t) {
        var c = a.K,
        d = c.Yc,
        c = bu(c);
        if (d < c) return 0
    }
    this.Da = this.Td(a);
    return this.Da && this.Da.p.w === b ? (this.un = this.Md()) ? this.Jd(a) : 0 : 0
};
e.Wd = function() {
    return ! 0
};
e.Jd = function() {
    return 0
};
e.Md = function() {
    return null
};
e.Td = function() {
    return null
};
e.Ta = function() {
    return this.ka
};
function cu() {
    this.ka = 100;
    this.zE = du;
    this.AD = 0.8;
    this.Uq = null
}
e = cu.prototype;
e.Wa = function() {};
e.Oa = function() {};
e.od = function(a) {
    if (this.Uq) {
        var b = a.p.w;
        if (a.p.dd) {
            if (!b) return;
            this.vx(a)
        }
        b && $t(a) && au(b);
        a.Y = 1;
        a.p.dd = !1;
        0 === w.i.$a % 2 && sh(w.pc, a, "快逃!", "yellow")
    }
};
e.vx = function(a) {
    var b = k(3);
    a = a.p;
    var c = a.w,
    d = ug(c),
    f = wg(c),
    g = vg(c),
    c = xg(c);
    0 === b ? t(a.Qb, d + 1, f + 1) : 1 === b ? t(a.Qb, g - 1, f + 1) : 2 === b ? t(a.Qb, d + 1, c - 1) : t(a.Qb, g - 1, c - 1)
};
e.wd = function(a) {
    var b = a.K.Sa / $h(a.K.Jb);
    if (b > this.AD) return 0;
    var c;
    a: {
        c = qi(a);
        var d, f;
        for (f = 0; f < c.length; f++) if (d = c[f], a !== d && d.Da === a) {
            c = d;
            break a
        }
        c = null
    }
    this.Uq = c;
    return ! this.Uq || a.p.u.ac(this.Uq.p.u) > this.zE ? 0 : (1 - b) * this.ka
};
e.Ta = function() {
    return this.ka
};
function eu(a, b, c) {
    this.ka = c;
    this.Fa = null;
    this.CA = a;
    this.bb = b;
    this.fn = new Za;
    this.Jl = new Za;
    this.co = this.ax = 0
}
e = eu.prototype;
e.Wa = function() {
    this.co = this.ax = 0;
    this.Fa = null
};
e.Oa = function() {};
e.od = function(a) {
    this.ax == w.i.$a - 1 ? this.co++:this.co = 0;
    if (this.Fa && !(this.Fa.Va || this.Fa.Ja.Kd || this.Fa.Ja.bi) && this.vx(a)) {
        this.ax = w.i.$a;
        var b = a.p.w;
        b && $t(a) && au(b);
        a.Y = 1;
        a.p.dd = !1
    }
};
e.vx = function(a) {
    var b = a.p,
    c = b.u,
    d = b.w,
    f = ug(d),
    g = wg(d),
    h = vg(d),
    l = xg(d);
    a = qi(a);
    var n, p, s, u = 0;
    t(this.fn, 0, 0);
    t(this.Jl, 0, 0);
    for (s = 0; s < a.length; s++) n = a[s],
    n.Va || n.Ja.Kd || n.Ja.bi || n.p.w != d || (p = n.p.u, n = c.ac(p), n > this.CA || (0 === n ? t(this.fn, Math.random(), Math.random()) : (ab(this.fn, c), tb(this.fn, p), Nb(this.fn, 1 / n)), ib(this.Jl, this.fn), u++));
    if (0 === u) return ! 1;
    Mb(this.Jl);
    Nb(this.Jl, this.bb);
    ib(this.Jl, c);
    c = this.Jl.T;
    d = this.Jl.U;
    c < f ? c = f: c > h && (c = h);
    d < g ? d = g: d > l && (d = l);
    t(b.Qb, c, d);
    return ! 0
};
e.wd = function(a) {
    this.Fa = Jt(a);
    return this.Fa ? 2 < this.co ? this.co = 0 : a.p.u.ac(this.Fa.p.u) > this.CA ? 0 : this.ka: 0
};
e.Ta = function() {
    return this.ka
};
function fu(a, b, c, d) {
    this.ka = b;
    this.Fa = null;
    this.Ng = 0;
    this.bb = a;
    this.qk = c;
    this.YD = d
}
e = fu.prototype;
e.Wa = function() {};
e.Oa = function() {};
e.od = function(a) {
    if (this.Fa && !this.Fa.Va) {
        a.Cb(this.Fa);
        if (this.Ng <= this.bb) {
            if (!Ut(a)) return;
            Vt(a);
            a.Y = this.qk
        } else Nt(a.p.Qb, this.Fa.p.u, a.p.w),
        a.Y = 1;
        var b = a.p.w;
        b && $t(a) && au(b);
        Rd(a.p)
    }
};
e.wd = function(a) {
    if (!a.p.w) return 0;
    this.Fa = this.YD ? Lt(a) : Iq(a);
    if (!this.Fa) return 0;
    this.Ng = a.p.u.ac(this.Fa.p.u);
    return this.ka
};
e.Ta = function() {
    return this.ka
};
function gu(a) {
    this.Hn = null;
    this.ka = a;
    this.bb = 10
}
gu.prototype = new Zt;
e = gu.prototype;
e.Wa = function() {
    this.Hn = null
};
e.Oa = function(a) {
    this.Hn || 10 !== a.X || (this.Hn = a)
};
e.Kp = function(a) {
    var b;
    switch (k(8)) {
    case 0:
        b = "嘿,傻兮兮的头!";
        break;
    case 1:
        b = "榆木脑袋!";
        break;
    case 2:
        b = "哟!屌丝!";
        break;
    case 3:
        b = "愚蠢的怪物!";
        break;
    case 4:
        b = "你弱爆了!";
        break;
    case 5:
        b = "屌丝!";
        break;
    case 6:
        b = "胆小鬼!";
        break;
    default:
        b = "嘿,蠢货!"
    }
    sh(w.pc, a, b, "white")
};
e.Wd = function() {
    return this.Hn && wq(this.Hn)
};
e.Jd = function() {
    return this.Ta()
};
e.Md = function() {
    return this.Hn
};
e.Td = function(a) {
    if (a.Ja.Gn || !Ht(a, a.p.w)) return null;
    var b = a.K;
    return 0.8 > b.Sa / $h(b.Jb) ? null: a
};
function hu(a) {
    this.ka = a;
    this.Fa = null;
    this.Ng = 0;
    this.bb = G;
    this.qk = Kq
}
e = hu.prototype;
e.Wa = function() {
    this.Fa = null;
    this.Ng = 0
};
e.Oa = function() {};
e.od = function(a) {
    if (this.Fa && !this.Fa.Va) {
        a.Cb(this.Fa);
        if (this.Ng <= this.bb) {
            if (!Ut(a)) return;
            Vt(a);
            a.Y = this.qk
        } else Nt(a.p.Qb, this.Fa.p.u, a.p.w),
        a.Y = 1;
        var b = a.p.w;
        b && $t(a) && au(b);
        Rd(a.p)
    }
};
e.wd = function(a) {
    this.Fa = Iq(a);
    if (!this.Fa) return 0;
    a.Ja.wg ? (this.bb = Yh, this.qk = 2) : (this.bb = G, this.qk = Kq);
    this.Ng = a.p.u.ac(this.Fa.p.u);
    return this.ka
};
e.Ta = function() {
    return this.ka
};
function iu(a) {
    this.Dn = null;
    this.ka = a;
    this.bb = 10
}
iu.prototype = new Zt;
e = iu.prototype;
e.Wa = function() {
    this.Dn = null
};
e.Oa = function(a) {
    this.Dn || 11 !== a.X || (this.Dn = a)
};
e.Kp = function() {};
e.Wd = function() {
    return this.Dn && wq(this.Dn)
};
e.Jd = function() {
    return this.Ta()
};
e.Md = function() {
    return this.Dn
};
e.Td = function(a) {
    return a.Ja.wg || !Ht(a, a.p.w) ? null: a
};
function ju(a) {
    this.on = null;
    this.ka = a;
    this.bb = 10
}
ju.prototype = new Zt;
e = ju.prototype;
e.Wa = function() {
    this.on = null
};
e.Oa = function(a) {
    this.on || 12 !== a.X || (this.on = a)
};
e.Kp = function(a) {
    var b;
    switch (k(8)) {
    case 0:
        b = "杀戮!";
        break;
    case 1:
        b = "去死!";
        break;
    case 2:
        b = "万物皆杀!";
        break;
    case 3:
        b = "啊啊啊啊啊!";
        break;
    case 4:
        b = "凶手!";
        break;
    case 5:
        b = "怒了!";
        break;
    case 6:
        b = "我真的怒了.";
        break;
    default:
        b = "杀!"
    }
    sh(w.pc, a, b, "white")
};
e.Wd = function() {
    return this.on && wq(this.on)
};
e.Jd = function() {
    return this.Ta()
};
e.Md = function() {
    return this.on
};
e.Td = function(a) {
    return a.Ja.Vs || !Ht(a, a.p.w) ? null: a
};
function ku(a, b, c) {
    this.Vq = new eu(a, b, c)
}
e = ku.prototype;
e.Wa = function() {
    this.Vq.Wa()
};
e.Oa = function() {};
e.od = function(a) {
    this.Vq.od(a)
};
e.wd = function(a) {
    return a.Ja.wg ? 0 : this.Vq.wd(a)
};
e.Ta = function() {
    return this.Vq.Ta()
};
function lu(a, b) {
    this.ka = b;
    this.Fa = this.Vi = null;
    this.Ng = 0;
    this.bb = a
}
e = lu.prototype;
e.Wa = function() {
    this.Vi = null
};
e.Ta = function() {
    return this.ka
};
e.Oa = function(a) {
    this.Vi || 6 !== a.ga || (this.Vi = a)
};
e.od = function(a) {
    if (this.Vi && Ut(a) && wq(this.Vi)) if (a.Cb(this.Fa), this.Ng <= this.bb) {
        if (Ut(a)) {
            Vt(a);
            this.Vi.mq = w.i.$a;
            a.ld = this.Vi;
            a.Y = Jq;
            Rd(a.p);
            var b = a.p.w;
            b && $t(a) && au(b)
        }
    } else ab(a.p.Qb, this.Fa.p.u),
    a.Y = 1
};
e.wd = function(a) {
    if (!this.Vi || !wq(this.Vi) || !a.p.w) return 0;
    if (!fr.t) {
        var b = a.K,
        c = b.Yc,
        b = bu(b);
        if (c < b) return 0
    }
    return (this.Fa = Iq(a)) ? this.ka: 0
};
function mu(a, b) {
    this.fm = null;
    this.ka = b;
    this.bb = a
}
mu.prototype = new Zt;
e = mu.prototype;
e.Wa = function() {
    this.fm = null
};
e.Oa = function(a) {
    this.fm || 5 !== a.ga || (this.fm = a)
};
e.Wd = function() {
    return this.fm && wq(this.fm)
};
e.Md = function() {
    return this.fm
};
e.Jd = function(a) {
    a = qi(a);
    return 0 === a.length ? 0 : Math.min(this.Ta(), 5 / a.length * this.Ta())
};
e.Td = function(a) {
    return Iq(a)
};
function nu(a, b, c) {
    this.gm = null;
    this.X = c;
    this.ka = b;
    this.bb = a
}
nu.prototype = new Zt;
e = nu.prototype;
e.Wa = function() {
    this.gm = null
};
e.Oa = function(a) {
    this.gm || a.X !== this.X || (this.gm = a)
};
e.Wd = function() {
    return this.gm && wq(this.gm)
};
e.Md = function() {
    return this.gm
};
e.Jd = function() {
    return this.Ta()
};
e.Td = function(a) {
    return Iq(a)
};
function ou(a, b) {
    this.Zl = null;
    this.ka = b;
    this.bb = a
}
ou.prototype = new Zt;
e = ou.prototype;
e.Wa = function() {
    this.Zl = null
};
e.Oa = function(a) {
    this.Zl || 8 !== a.ga || (this.Zl = a)
};
e.Wd = function() {
    return this.Zl && wq(this.Zl)
};
e.Md = function() {
    return this.Zl
};
e.Jd = function() {
    return this.Ta()
};
e.Td = function(a) {
    return Iq(a)
};
function pu(a, b) {
    this.In = null;
    this.ka = b;
    this.bb = a
}
pu.prototype = new Zt;
e = pu.prototype;
e.Wa = function() {
    this.In = null
};
e.Oa = function(a) {
    this.In || 12 !== a.ga || (this.In = a)
};
e.Wd = function() {
    return this.In && wq(this.In)
};
e.Md = function() {
    return this.In
};
e.Jd = function() {
    return this.Ta()
};
e.Td = function(a) {
    return Iq(a)
};
function qu(a, b, c) {
    this.zd = null;
    this.ga = c;
    this.ka = b;
    this.bb = a
}
qu.prototype = new Zt;
e = qu.prototype;
e.Wa = function() {
    this.zd = null
};
e.Oa = function(a) {
    this.zd || a.ga !== this.ga || (this.zd = a)
};
e.Wd = function() {
    return this.zd && wq(this.zd)
};
e.Md = function() {
    return this.zd
};
e.Jd = function() {
    return this.Ta()
};
e.Td = function(a) {
    return Iq(a)
};
function ru(a, b) {
    this.ka = b;
    this.bb = a;
    this.Lm = null
}
ru.prototype = new Zt;
e = ru.prototype;
e.Wa = function() {
    this.Lm = null
};
e.Oa = function(a) {
    this.Lm || 1 !== a.ga || (this.Lm = a)
};
e.Jd = function() {
    var a = this.Da;
    return Math.max(0, (1 - a.K.Sa / $h(a.K.Jb)) * this.Ta())
};
e.Wd = function() {
    return this.Lm && wq(this.Lm)
};
e.Md = function() {
    return this.Lm
};
e.Td = function(a) {
    var b = null,
    c = 1,
    d = si(a),
    f,
    g,
    h;
    for (a = 0; a < d.length; a++) if (f = d[a], h = f.K, g = h.Sa, h = $h(h.Jb), g !== h && (g /= h, !b || g < c)) c = g,
    b = f;
    return 0.9 < c ? null: b
};
function su(a, b) {
    this.ka = b;
    this.bb = a;
    this.pn = null
}
su.prototype = new Zt;
e = su.prototype;
e.Wa = function() {
    this.pn = null
};
e.Oa = function(a) {
    this.pn || 16 !== a.ga || (this.pn = a)
};
e.Jd = function() {
    return this.Ta()
};
e.Wd = function() {
    return this.pn && wq(this.pn)
};
e.Md = function() {
    return this.pn
};
e.Td = function(a) {
    var b, c = w.i.D,
    d;
    for (b = 0; b < c.length; b++) if (d = c[b], d !== a && d.Ja.Kf) return d;
    return null
};
function tu(a, b, c) {
    this.ka = c;
    this.bb = a;
    this.X = b;
    this.zd = null
}
tu.prototype = new Zt;
e = tu.prototype;
e.Wa = function() {
    this.zd = null
};
e.Oa = function(a) {
    this.zd || a.X !== this.X || (this.zd = a)
};
e.Wd = function() {
    return this.zd && wq(this.zd)
};
e.Jd = function() {
    return this.Ta()
};
e.Md = function() {
    return this.zd
};
e.Td = function(a) {
    return a
};
function uu() {
    this.eo = 2
}
e = uu.prototype;
e.Wa = function() {};
e.Oa = function() {};
e.od = function(a) {
    if (!vu(w.i.da) || !wu(a)) {
        var b = w.i.da,
        c = b.Cc,
        d = b.Bc,
        b = b.ed,
        f = a.p;
        if (d && d != f.Bc) {
            var g = Ot(a, d);
            f.Ug = g;
            f.dd = !1
        } else b && b != f.ed ? (g = Qt(a, b.$d), f.Ug = g, f.dd = !1) : c && c != f.Cc && (g = Qt(a, c), f.Ug = g, f.dd = !1);
        f.et(d);
        f.Cc = c;
        f.rB(b);
        d ? (t(f.Qb, d.me, d.ne), a.Y = 1) : b ? (t(f.Qb, b.tq, b.uq), a.Y = 1) : c && (a.Y = 1)
    }
};
e.wd = function(a) {
    if (w.wb || vu(w.i.da) && wu(a)) return 0;
    var b = qi(a);
    return 0 < b.length && a.p.w === b[0].p.w ? 0 : this.eo
};
function wu(a) {
    var b;
    return (b = w.i.da.gn) ? a.p.Cc === b ? !1 : !0 : !1
}
e.Ta = function() {
    return this.eo
};
function xu(a) {
    this.Wm = null;
    this.ka = a;
    this.Yt = !0;
    this.bb = 10
}
xu.prototype = new Zt;
e = xu.prototype;
e.Wa = function() {
    this.Wm = null
};
e.Oa = function(a) {
    this.Wm || 14 !== a.ga || (this.Wm = a)
};
e.Wd = function() {
    return this.Wm && wq(this.Wm)
};
e.Jd = function(a) {
    return Ht(a, a.p.w) ? 0 : yu() ? this.Ta() : 0
};
e.Md = function() {
    return this.Wm
};
e.Td = function(a) {
    return yu() ? a: null
};
function yu() {
    return 0 < w.ff.pe.length || 0 < w.dh.yf.length || 0 < w.Uh.kf.length
};
function zu(a) {
    this.pm = null;
    this.ka = a;
    this.Yt = !0;
    this.bb = 10
}
zu.prototype = new Zt;
e = zu.prototype;
e.Wa = function() {
    this.pm = null
};
e.Oa = function(a) {
    this.pm || 15 !== a.ga || (this.pm = a)
};
e.Wd = function() {
    return this.pm && wq(this.pm)
};
e.Jd = function(a) {
    var b = a.p.w;
    if (!b || Ht(a, b)) return 0;
    a = Ji(w.th, b);
    return ! a || a.Kg || a.el ? 0 : this.Ta()
};
e.Md = function() {
    return this.pm
};
e.Td = function(a) {
    return a
};
function Au(a, b) {
    this.Mi = w.B + 5;
    this.ka = a;
    this.il = b;
    this.qd = null;
    this.Wy = 0
}
e = Au.prototype;
e.Wa = function() {
    this.qd = null
};
e.Oa = function() {};
e.od = function(a) {
    if (this.qd) if (this.qd.gc) this.qd = null;
    else if (this.qd.Zc == a) {
        a.rh = this.qd;
        Jb(a.p.u, this.qd.Xo, this.qd.Yo) < this.Mi ? a.Y = 5 : (t(a.p.Qb, this.qd.Xo, this.qd.Yo), a.Y = 1);
        Rd(a.p);
        var b = a.p.w;
        b && $t(a) && au(b)
    }
};
e.wd = function(a) {
    var b = a.p.w;
    if (!b || Ht(a, b)) return 0;
    this.qd && this.qd.Zc === a && (this.qd.Re(null), this.qd.Se(0));
    var b = w.ff.pe,
    c, d, f = a.p.u,
    g = null,
    h, l = a.p.w,
    n = -1;
    if (l) {
        for (d = 0; d < b.length; d++) c = b[d],
        c.gc || c.vD !== l || (h = Kb(f, c.Xo, c.Yo), c.Zc && h > c.Ud() || !(0 > n || h < n) || (g = c, n = h));
        if (this.qd = g) this.qd.Re(a),
        this.qd.Se(n),
        this.Wy = Math.sqrt(n)
    }
    return this.qd ? Mt(this.ka, this.il, this.Wy) : 0
};
e.Ta = function() {
    return this.ka
};
function Bu(a, b) {
    this.Mi = w.B + 5;
    this.ka = a;
    this.il = b;
    this.bd = null;
    this.Zy = 0
}
e = Bu.prototype;
e.Wa = function() {
    this.bd = null
};
e.Oa = function() {};
e.od = function(a) {
    if (this.bd) if (this.bd.gc) this.bd = null;
    else if (this.bd.Zc == a) {
        a.Zh = this.bd;
        Jb(a.p.u, this.bd.bq, this.bd.cq) < this.Mi ? a.Y = 7 : (t(a.p.Qb, this.bd.bq, this.bd.cq), a.Y = 1);
        Rd(a.p);
        var b = a.p.w;
        b && $t(a) && au(b)
    }
};
e.wd = function(a) {
    var b = a.p.w;
    if (!b || Ht(a, b)) return 0;
    this.bd && this.bd.Zc === a && (this.bd.Re(null), this.bd.Se(0));
    var b = w.Uh.kf,
    c, d, f = a.p.u,
    g = null,
    h, l = a.p.w,
    n = -1;
    if (l) {
        for (d = 0; d < b.length; d++) c = b[d],
        c.gc || c.BE !== l || (h = Kb(f, c.bq, c.cq), c.Zc && h > c.Ud() || !(0 > n || h < n) || (g = c, n = h));
        if (this.bd = g) this.bd.Re(a),
        this.bd.Se(n),
        this.Zy = Math.sqrt(n)
    }
    return this.bd ? Mt(this.ka, this.il, this.Zy) : 0
};
e.Ta = function() {
    return this.ka
};
function Cu(a, b) {
    this.Mi = w.B + 5;
    this.ka = a;
    this.il = b;
    this.ad = null;
    this.Yy = 0
}
e = Cu.prototype;
e.Wa = function() {
    this.ad = null
};
e.Oa = function() {};
e.od = function(a) {
    if (this.ad) if (this.ad.gc) this.ad = null;
    else if (this.ad.Zc == a) {
        a.hk = this.ad;
        Jb(a.p.u, this.ad.Qp, this.ad.Rp) < this.Mi ? a.Y = 8 : (t(a.p.Qb, this.ad.Qp, this.ad.Rp), a.Y = 1);
        Rd(a.p);
        var b = a.p.w;
        b && $t(a) && au(b)
    }
};
e.wd = function(a) {
    var b = a.p.w;
    if (!b || Ht(a, b)) return 0;
    this.ad && this.ad.Zc === a && (this.ad.Re(null), this.ad.Se(0));
    var b = w.Ti.Hf,
    c, d, f = a.p.u,
    g = null,
    h, l = a.p.w,
    n = -1;
    if (l) {
        for (d = 0; d < b.length; d++) c = b[d],
        c.gc || c.oE !== l || (h = Kb(f, c.Qp, c.Rp), c.Zc && h > c.Ud() || !(0 > n || h < n) || (g = c, n = h));
        if (this.ad = g) this.ad.Re(a),
        this.ad.Se(n),
        this.Yy = Math.sqrt(n)
    }
    return this.ad ? Mt(this.ka, this.il, this.Yy) : 0
};
e.Ta = function() {
    return this.ka
};
function Du(a, b) {
    this.Mi = w.B + 5;
    this.ka = a;
    this.il = b;
    this.$c = null;
    this.Xy = 0
}
e = Du.prototype;
e.Wa = function() {
    this.$c = null
};
e.Oa = function() {};
e.od = function(a) {
    if (this.$c) if (this.$c.gc) this.$c = null;
    else if (this.$c.Zc == a) {
        a.bj = this.$c;
        Jb(a.p.u, this.$c.mp, this.$c.np) < this.Mi ? a.Y = 6 : (t(a.p.Qb, this.$c.mp, this.$c.np), a.Y = 1);
        Rd(a.p);
        var b = a.p.w;
        b && $t(a) && au(b)
    }
};
e.wd = function(a) {
    var b = a.p.w;
    if (!b || Ht(a, b)) return 0;
    this.$c && this.$c.Zc === a && (this.$c.Re(null), this.$c.Se(0));
    var b = w.dh.yf,
    c, d, f = a.p.u,
    g = null,
    h, l = a.p.w,
    n = -1;
    if (l) {
        for (d = 0; d < b.length; d++) c = b[d],
        c.gc || c.PD !== l || (h = Kb(f, c.mp, c.np), c.Zc && h > c.Ud() || !(0 > n || h < n) || (g = c, n = h));
        if (this.$c = g) this.$c.Re(a),
        this.$c.Se(n),
        this.Xy = Math.sqrt(n)
    }
    return this.$c ? Mt(this.ka, this.il, this.Xy) : 0
};
e.Ta = function() {
    return this.ka
};
function Eu() {
    this.Mi = w.B + 1;
    this.ka = 90;
    this.lc = null
}
e = Eu.prototype;
e.Wa = function() {
    this.lc = null
};
e.Oa = function() {};
e.od = function(a) {
    if (this.lc && !this.lc.Kg) {
        a.hq(this.lc);
        Jb(a.p.u, this.lc.zq, this.lc.Aq) < this.Mi ? a.Y = 12 : (t(a.p.Qb, this.lc.zq, this.lc.Aq), a.Y = 1);
        Rd(a.p);
        var b = a.p.w;
        b && $t(a) && au(b)
    }
};
e.wd = function(a) {
    var b = a.p.w;
    if (!b) return 0;
    this.lc = Ji(w.th, b);
    return ! this.lc || this.lc.Kg || !this.lc.el || Ht(a, b) ? 0 : this.ka
};
e.Ta = function() {
    return this.ka
};
function Fu(a) {
    this.Sc = null;
    this.ka = a;
    this.bb = 10
}
Fu.prototype = new Zt;
e = Fu.prototype;
e.Wa = function() {
    this.Sc = null
};
e.Oa = function(a) {
    this.Sc || 9 !== a.ga || (this.Sc = a)
};
e.Kp = function(a) {
    sh(w.pc, a, "Protect me", "white")
};
e.Wd = function(a) {
    return this.Sc && wq(this.Sc) && !a.En ? !0 : !1
};
e.Jd = function() {
    return this.Ta()
};
e.Md = function() {
    return this.Sc
};
e.Td = function(a) {
    return a
};
function Gu(a, b, c) {
    this.Sc = null;
    this.KE = c;
    this.ka = b;
    this.bb = a
}
Gu.prototype = new Zt;
e = Gu.prototype;
e.Wa = function() {
    this.Sc = null
};
e.Oa = function(a) {
    this.Sc || a.ga !== this.KE || (this.Sc = a)
};
e.Wd = function(a) {
    if (!this.Sc || !wq(this.Sc)) return ! 1;
    var b = a.K.gl;
    return Hu(a) < b
};
e.Jd = function() {
    return this.Ta()
};
e.Md = function() {
    return this.Sc
};
e.Td = function(a) {
    return a
};
function Iu(a, b) {
    this.Sc = null;
    this.ka = b;
    this.bb = a
}
Iu.prototype = new Zt;
e = Iu.prototype;
e.Wa = function() {
    this.Sc = null
};
e.Oa = function(a) {
    this.Sc || 11 !== a.ga || (this.Sc = a)
};
e.Wd = function(a) {
    if (!this.Sc || !wq(this.Sc)) return ! 1;
    var b = a.p.w;
    if (!b) return ! 1;
    var c = w.Gf.Og;
    if (!c || 0 === c.length) return ! 1;
    var d, f = !1;
    for (d = 0; d < c.length; d++) if (c[d].p.w === b) {
        f = !0;
        break
    }
    if (!f) return ! 1;
    b = a.K.gl;
    return Hu(a) < b
};
e.Jd = function() {
    return this.Ta()
};
e.Md = function() {
    return this.Sc
};
e.Td = function(a) {
    var b = w.Gf.Og;
    if (0 === b.length) return null;
    var c = a.p.w;
    if (!c) return null;
    var d, f = a.p.u,
    g = null,
    h, l = -1;
    for (d = 0; d < b.length; d++) if (a = b[d], a.p.w === c && (h = f.Ud(a.p.u), 0 > l || h < l)) g = a,
    l = h;
    return g
};
function Ju(a, b) {
    this.ka = b;
    this.Uw = a
}
e = Ju.prototype;
e.Wa = function() {};
e.Oa = function() {};
e.od = function(a) {
    Nt(a.p.Qb, a.xg.p.u, a.p.w);
    a.Y = 1;
    Rd(a.p)
};
e.wd = function(a) {
    if (w.wb) return 0;
    var b = a.p;
    a = a.xg.p;
    return ! b.w || !a.w || b.w !== a.w || b.u.ac(a.u) < this.Uw ? 0 : this.ka
};
e.Ta = function() {
    return this.ka
};
function Ku(a, b, c, d) {
    this.ka = c;
    this.Fa = null;
    this.Ng = 0;
    this.bb = a;
    this.Uw = b;
    this.qk = d
}
e = Ku.prototype;
e.Wa = function() {};
e.Oa = function() {};
e.od = function(a) {
    if (this.Fa && !this.Fa.Va) {
        a.Cb(this.Fa);
        if (this.Ng <= this.bb) {
            if (!Ut(a)) return;
            Vt(a);
            a.Y = this.qk
        } else Nt(a.p.Qb, this.Fa.p.u, a.p.w),
        a.Y = 1;
        var b = a.p.w;
        b && $t(a) && au(b);
        Rd(a.p)
    }
};
e.wd = function(a) {
    if (w.wb) return 0;
    var b = a.xg;
    a = a.p;
    var c = b.p;
    if (!a.w || !c.w || a.w !== c.w) return 0;
    this.Fa = Iq(b);
    if (!this.Fa) return 0;
    b = this.Fa.p.u;
    if (c.u.ac(b) > this.Uw) return 0;
    this.Ng = a.u.ac(b);
    return this.ka
};
e.Ta = function() {
    return this.ka
};
function Lu(a) {
    this.eo = a
}
e = Lu.prototype;
e.Wa = function() {};
e.Oa = function() {};
e.od = function(a) {
    var b = a.p;
    if (b.w) {
        var c = b.w,
        d = b.Qb;
        ab(d, b.u);
        Fg(c, d, w.B + 1);
        b.dd = !1;
        b.dd = !1;
        a.Y = 1
    }
};
e.wd = function(a) {
    if (w.wb) return 0;
    var b = a.p;
    if (b.Ug && 0 < b.Ug.length || b.Bc || b.ed || b.Cc) return 0;
    a = b.w;
    if (!a) return 0;
    b = b.u;
    return Gg(a, b) || a.Za && Jb(b, a.Za.tq, a.Za.uq) < w.B ? this.eo: 0
};
e.Ta = function() {
    return this.eo
};
var Yh = 50,
G = 140,
du = 50,
Mu = {
    Xf: 1.15,
    Qf: 0.9,
    Rf: 1,
    Zf: 0.9,
    Cf: 0.9,
    Ef: 1.15
},
Nu = {
    Xf: 1,
    Qf: 1,
    Rf: 1,
    Zf: 1,
    Cf: 1,
    Ef: 1
},
Ou = {
    Xf: 1,
    Qf: 0.8,
    Rf: 1,
    Zf: 0.8,
    Cf: 0.5,
    Ef: 1.1
},
Pu = {
    pa: 0,
    Ka: "战士",
    vg: "战士",
    d: "HumanFighter2.PNG",
    za: "雨果",
    yb: "坦克角色.强力的近战攻击.",
    Le: 0,
    fe: !1,
    tb: [{
        r: "20",
        s: 1
    },
    {
        r: "80",
        s: 2
    },
    {
        r: "40",
        s: 4
    },
    {
        r: "120",
        s: 5
    },
    {
        r: "101",
        s: 3
    },
    {
        r: "185",
        s: 6
    }],
    Ma: {
        Xf: 0.95,
        Qf: 1,
        Rf: 0.95,
        Zf: 1.1,
        Cf: 1.1,
        Ef: 0.9
    },
    kc: oq,
    Qg: function() {
        return [new F(Kj), new F(ck), new F(Lj), new F(dk), new F(gk), new F(Mj), new F(ek), new Ds(nt), new F(fk)]
    },
    Rg: function() {
        return [new F(Hj), new F(Zj), new F(Ij), new F(ak), new F(hk), new F(Jj), new F(bk), new F(mk), new F(nk)]
    },
    Sg: function() {
        return [new F(Qj), new F(Wj), new F(Rj), new F(Xj), new F(ik), new F(Sj), new F(Yj), new F(kk), new F(ok)]
    },
    Tg: function() {
        return [new F(Nj), new F(Tj), new F(Oj), new F(Uj), new F(jk), new F(Pj), new F(Vj), new F(lk), new F(pk)]
    },
    nb: function() {
        return [new cu, new Lu(99), new gu(98), new fu(Yh, 90, 2, !1), new Eu, new Du(60, 10), new Bu(60, 10), new Cu(60, 10), new Au(60, 10), new uu]
    }
},
Qu = {
    pa: 6,
    Ka: "牧师",
    vg: "牧师",
    d: "HumanPriest4.PNG",
    za: "克罗诺斯",
    yb: "医生兼杀手.利用近战伤害加成法术帮助队伍.",
    Le: 0,
    fe: !1,
    tb: [{
        r: "22",
        s: 1
    },
    {
        r: "163",
        s: 5
    },
    {
        r: "82",
        s: 2
    },
    {
        r: "41",
        s: 4
    },
    {
        r: "181",
        s: 3
    },
    {
        r: "145",
        s: 6
    }],
    Ma: {
        Xf: 0.95,
        Qf: 1,
        Rf: 0.95,
        Zf: 1.05,
        Cf: 1,
        Ef: 1.05
    },
    kc: nq,
    Qg: function() {
        return [new Ds(tt), new F(bl), new Ds(ut), new F(Hl), new F(cl), new F(ll), new F(dl), new F(Jl), new F(El)]
    },
    Rg: function() {
        return [new F(ol), new F(Zk), new Ds(vt), new F(pl), new F($k), new F(Fl), new F(nl), new F(al), new F(Il)]
    },
    Sg: function() {
        return [new F(ql), new F(el), new Ds(wt), new F(Bl), new F(fl), new F(kl), new F(gl), new F(Gl), new F(Kl)]
    },
    Tg: function() {
        return [new F(Cl), new F(hl), new Ds(xt), new F(Dl), new F(jl), new F(ml), new F(il), new F(Ll), new Ds(yt)]
    },
    nb: function() {
        return [new cu, new Lu(99), new su(Yh, 94), new ru(G, 90), new tu(G, 6, 81), new tu(G, 5, 80), new tu(G, 7, 79), new tu(G, 8, 78), new fu(Yh, 60, 2, !1), new Eu, new Du(60, 10), new Bu(60, 10), new Cu(60, 10), new Au(60, 10), new uu]
    }
},
Ru = {
    pa: 2,
    Ka: "游侠",
    vg: "游侠",
    d: "FemaleRanger01.PNG",
    za: "艾丽",
    yb: "美丽又致命.远程攻击.",
    Le: 0,
    fe: !1,
    tb: [{
        r: "60",
        s: 1
    },
    {
        r: "23",
        s: 3
    },
    {
        r: "83",
        s: 2
    },
    {
        r: "143",
        s: 5
    },
    {
        r: "3",
        s: 4
    }],
    Ma: {
        Xf: 1.15,
        Qf: 0.9,
        Rf: 1.15,
        Zf: 0.9,
        Cf: 0.9,
        Ef: 0.9
    },
    kc: null,
    Qg: function() {
        return [new F(Zm), new F(vn), new F($m), new F(zn), new F(hn), new F(mn), new F(an), new F(tn)]
    },
    Rg: function() {
        return [new F(Wm), new F(jn), new F(wn), new F(Xm), new F(An), new F(pn), new F(Ym), new F(on)]
    },
    Sg: function() {
        return [new F(en), new F(nn), new F(fn), new F(xn), new F(kn), new F(Bn), new F(gn), new F(rn)]
    },
    Tg: function() {
        return [new F(bn), new F(qn), new F(cn), new F(sn), new F(yn), new F(dn), new F(Cn), new F(un), new F(ln)]
    },
    nb: function() {
        return [new cu, new Lu(99), new eu(du, G, 95), new fu(G, 90, Kq, !1), new Eu, new Du(60, 10), new Bu(60, 10), new Cu(60, 10), new Au(60, 10), new uu]
    }
},
Su = {
    pa: 4,
    Ka: "火法师",
    vg: "火法师",
    d: "FemaleMage01.PNG",
    za: "娜塔莎",
    yb: "法术为基础的远程攻击.火焰魔法.",
    Le: 0,
    fe: !0,
    tb: [{
        r: "27",
        s: 1
    },
    {
        r: "86",
        s: 2
    },
    {
        r: "122",
        s: 4
    },
    {
        r: "161",
        s: 5
    },
    {
        r: "141",
        s: 3
    },
    {
        r: "183",
        s: 6
    }],
    Ma: Mu,
    kc: lq,
    Qg: function() {
        return [new Ds(Dt), new F(rm), new F(Em), new F(sm), new F(Im), new F(tm), new F(Km), new F(Nm), new F(Gm)]
    },
    Rg: function() {
        return [new F(xm), new Ds(Gt), new F(ym), new F(Pm), new F(zm), new F(Qm), new F(Om), new F(Rm), new F(Fm)]
    },
    Sg: function() {
        return [new F(um), new F(Hm), new Ds(Ft), new F(vm), new F(Dm), new F(Sm), new F(wm), new F(Mm), new F(Tm)]
    },
    Tg: function() {
        return [new F(Am), new F(Jm), new Ds(Et), new F(Bm), new F(Um), new F(Cm), new F(Vm), new F(Lm)]
    },
    nb: function() {
        return [new cu, new Lu(99), new eu(du, G, 95), new ou(G, 95), new lu(G, 95), new qu(G, 85, 4), new nu(G, 60, 4), new Eu, new Du(60, 10), new Bu(60, 10), new Cu(60, 10), new Au(60, 10), new uu]
    }
},
Tu = {
    pa: 7,
    Ka: "盗贼",
    vg: "盗贼",
    d: "HumanThief4.PNG",
    za: "凯西",
    yb: "潜行攻击.远程进战两相宜.强大的寻宝能力.",
    Le: 0,
    fe: !1,
    tb: [{
        r: "24",
        s: 3
    },
    {
        r: "25",
        s: 4
    },
    {
        r: "61",
        s: 1
    },
    {
        r: "84",
        s: 2
    },
    {
        r: "100",
        s: 5
    },
    {
        r: "88",
        s: 6
    }],
    Ma: Nu,
    kc: pq,
    Qg: function() {
        return [new F(Gn), new F(Hn), new F(Vn), new F(In), new Ds(qt), new F(Wn), new F(fo), new F($n), new F(ho)]
    },
    Rg: function() {
        return [new F(Dn), new F(Xn), new F(ao), new F(En), new F(Yn), new F(bo), new F(Fn), new F(Zn), new F(co)]
    },
    Sg: function() {
        return [new F(Mn), new F(Sn), new F(Nn), new F(Tn), new F(io), new F(On), new F(Un), new F(jo), new Ds(rt)]
    },
    Tg: function() {
        return [new F(Jn), new F(Pn), new F(eo), new F(Kn), new F(Qn), new F(go), new F(Ln), new F(Rn), new Ds(st)]
    },
    nb: function() {
        return [new cu, new Lu(99), new iu(98), new ku(du, G, 95), new hu(95), new Eu, new zu(75), new xu(70), new Du(60, 10), new Bu(60, 10), new Cu(60, 10), new Au(60, 10), new uu]
    }
},
Uu = {
    pa: 10,
    Ka: "德鲁伊",
    vg: "德鲁伊",
    d: "HumanDruid01.PNG",
    za: "德拉格",
    yb: "强大的召唤师/牧师的结合体.能召唤野狼和一只宠物狗.",
    Le: 0,
    fe: !0,
    tb: [{
        r: "31",
        s: 1
    },
    {
        r: "91",
        s: 2
    },
    {
        r: "202",
        s: 6
    },
    {
        r: "203",
        s: 5
    },
    {
        r: "164",
        s: 3
    },
    {
        r: "7",
        s: 4
    }],
    Ma: Nu,
    kc: sq,
    Qg: function() {
        return [new Ds(dt), new F(Po), new F(mp), new F(Qo), new F(kp), new F(Ro), new F(qp), new F(lp), new Ds(et)]
    },
    Rg: function() {
        return [new F(Vo), new Ds(ft), new F(Wo), new F(rp), new F(Xo), new F(sp), new F(cp), new F(dp), new F(tp)]
    },
    Sg: function() {
        return [new F(So), new F(ep), new F(ap), new F(op), new F(To), new F(fp), new F(bp), new F(np), new F(Uo)]
    },
    Tg: function() {
        return [new F(Yo), new F(gp), new F(Zo), new F(ip), new F(hp), new F($o), new F(pp), new F(jp), new Ds(ct)]
    },
    nb: function() {
        return [new cu, new Lu(99), new eu(du, G, 95), new Fu(90), new Gu(G, 85, 10), new ru(G, 75), new nu(G, 60, 0), new Eu, new Du(60, 10), new Bu(60, 10), new Cu(60, 10), new Au(60, 10), new uu]
    }
},
Vu = {
    pa: 1,
    Ka: "野蛮人",
    vg: "野蛮人",
    eF: !1,
    d: "BarbarianFighter4.PNG",
    za: "拉戈尔",
    yb: "坦克角色.能力:愤怒,猛锤.",
    Le: 1,
    fe: !1,
    tb: [{
        r: "21",
        s: 1
    },
    {
        r: "81",
        s: 2
    },
    {
        r: "102",
        s: 3
    },
    {
        r: "144",
        s: 5
    },
    {
        r: "180",
        s: 4
    },
    {
        r: "4",
        s: 6
    }],
    Ma: {
        Xf: 1.05,
        Qf: 0.95,
        Rf: 1.05,
        Zf: 0.95,
        Cf: 1,
        Ef: 1
    },
    kc: qq,
    Qg: function() {
        return [new F(Ui), new F(yj), new Ds(pt), new F(Vi), new F(zj), new F(Fj), new F(Wi), new F(Aj), new F(Gj)]
    },
    Rg: function() {
        return [new F(Ri), new F(tj), new F(Si), new F(Bj), new F(uj), new F(Ti), new F(vj), new F(Cj), new Ds(ot)]
    },
    Sg: function() {
        return [new F($i), new F(oj), new F(aj), new F(wj), new F(pj), new F(bj), new F(qj), new F(xj), new F(Dj)]
    },
    Tg: function() {
        return [new F(Xi), new F(lj), new F(rj), new F(Yi), new F(mj), new F(Zi), new F(sj), new F(nj), new F(Ej)]
    },
    nb: function() {
        return [new cu, new Lu(99), new ju(98), new ou(Yh, 100), new fu(Yh, 90, 2, !1), new Eu, new Du(60, 10), new Bu(60, 10), new Cu(60, 10), new Au(60, 10), new uu]
    }
},
Wu = {
    pa: 3,
    Ka: "电法师",
    vg: "电法师",
    d: "HumanMage15.PNG",
    za: "凯恩",
    yb: "法术为基础的远程攻击.电气魔法.",
    Le: 1,
    fe: !0,
    tb: [{
        r: "26",
        s: 1
    },
    {
        r: "85",
        s: 2
    },
    {
        r: "121",
        s: 4
    },
    {
        r: "160",
        s: 5
    },
    {
        r: "140",
        s: 3
    },
    {
        r: "182",
        s: 6
    }],
    Ma: Mu,
    kc: kq,
    Qg: function() {
        return [new Ds(zt), new F(Ml), new F(Zl), new F(Nl), new F(cm), new F(Ol), new F(em), new F(hm), new F(am)]
    },
    Rg: function() {
        return [new F(Sl), new Ds(At), new F(Tl), new F(jm), new F(Ul), new F(km), new F(im), new F(lm), new F($l)]
    },
    Sg: function() {
        return [new F(Pl), new F(bm), new Ds(Bt), new F(Ql), new F(Yl), new F(pm), new F(Rl), new F(gm), new F(qm)]
    },
    Tg: function() {
        return [new F(Vl), new F(dm), new Ds(Ct), new F(Wl), new F(mm), new F(Xl), new F(nm), new F(fm), new F(om)]
    },
    nb: function() {
        return [new cu, new Lu(99), new eu(du, G, 95), new mu(G, 95), new lu(G, 95), new qu(G, 85, 4), new nu(G, 60, 1), new Eu, new Du(60, 10), new Bu(60, 10), new Cu(60, 10), new Au(60, 10), new uu]
    }
},
Xu = {
    pa: 8,
    Ka: "忍者",
    vg: "忍者",
    d: "Ninja.PNG",
    za: "明治",
    yb: "喜欢在海滩上散步和杀死怪物.",
    Le: 2,
    fe: !1,
    tb: [{
        r: "29",
        s: 3
    },
    {
        r: "62",
        s: 1
    },
    {
        r: "89",
        s: 4
    },
    {
        r: "186",
        s: 2
    },
    {
        r: "5",
        s: 5
    },
    {
        r: "33",
        s: 6
    }],
    Ma: {
        Xf: 1.1,
        Qf: 0.9,
        Rf: 1.1,
        Zf: 1.1,
        Cf: 1,
        Ef: 1
    },
    kc: tq,
    Qg: function() {
        return [new F(tk), new F(Qk), new Ds(it), new F(uk), new F(Ok), new F(Xk), new F(vk), new F(Pk), new F(Yk)]
    },
    Rg: function() {
        return [new F(qk), new F(Ik), new F(Lk), new F(rk), new F(Jk), new F(Mk), new F(sk), new F(Kk), new F(Nk)]
    },
    Sg: function() {
        return [new F(zk), new F(Fk), new F(Rk), new F(Ak), new F(Gk), new F(Vk), new F(Bk), new F(Hk), new F(Wk)]
    },
    Tg: function() {
        return [new F(wk), new F(Ck), new F(Sk), new F(xk), new F(Dk), new F(Tk), new F(yk), new F(Ek), new F(Uk)]
    },
    nb: function() {
        return [new cu, new Lu(99), new pu(G, 95), new eu(du, G, 90), new fu(G, 85, Kq, !1), new Eu, new Du(60, 10), new Bu(60, 10), new Cu(60, 10), new Au(60, 10), new uu]
    }
},
Yu = {
    pa: 9,
    Ka: "死灵法师",
    vg: "死灵法师",
    d: "Unique1.PNG",
    za: "无名",
    yb: "召唤者:唤醒骷髅军队.",
    Le: 2,
    fe: !0,
    tb: [{
        r: "30",
        s: 1
    },
    {
        r: "90",
        s: 2
    },
    {
        r: "200",
        s: 6
    },
    {
        r: "201",
        s: 5
    },
    {
        r: "6",
        s: 3
    },
    {
        r: "124",
        s: 4
    }],
    Ma: Mu,
    kc: rq,
    Qg: function() {
        return [new Ds(jt), new F(ko), new F(xo), new F(lo), new F(Bo), new F(mo), new F(Eo), new F(Ho), new F(zo)]
    },
    Rg: function() {
        return [new F(qo), new Ds(lt), new F(yo), new F(ro), new F(Ko), new F(Co), new F(so), new F(Io), new F(Lo)]
    },
    Sg: function() {
        return [new F(no), new F(Ao), new F(oo), new F(Jo), new F(wo), new F(po), new F(Go), new Ds(mt)]
    },
    Tg: function() {
        return [new F(to), new F(Do), new Ds(kt), new F(uo), new F(Mo), new F(Fo), new F(No), new F(vo), new F(Oo)]
    },
    nb: function() {
        return [new cu, new Lu(99), new eu(du, G, 95), new Fu(94), new Iu(G, 90), new qu(G, 89, 13), new qu(G, 85, 4), new Eu, new Du(60, 10), new Bu(60, 10), new Cu(60, 10), new Au(60, 10), new uu]
    }
},
Zu = {
    pa: 11,
    Ka: "鸡王",
    vg: "鸡王",
    d: "Unique4.PNG",
    za: "家禽领主",
    yb: "纯鸡召唤者.",
    Le: 3,
    fe: !0,
    tb: [{
        r: "32",
        s: 1
    },
    {
        r: "92",
        s: 2
    },
    {
        r: "204",
        s: 6
    },
    {
        r: "125",
        s: 5
    },
    {
        r: "165",
        s: 3
    },
    {
        r: "205",
        s: 4
    }],
    Ma: Mu,
    kc: uq,
    Qg: function() {
        return [new Ds(gt), new F(xp), new F(Hp), new F(Lp), new F(yp), new F(aq), new F(Wp), new F(zp), new F(iq)]
    },
    Rg: function() {
        return [new F(up), new F(Ip), new F(vp), new F(Zp), new F(wp), new F(cq), new F(Jp), new Ds(ht)]
    },
    Sg: function() {
        return [new F(Ap), new F(Kp), new F(dq), new F(Bp), new F(Gp), new F(eq), new F(Cp), new F(Yp), new F(hq)]
    },
    Tg: function() {
        return [new F(Dp), new F(Mp), new F(fq), new F(Ep), new F(Xp), new F(bq), new F(Fp), new F($p), new F(gq)]
    },
    nb: function() {
        return [new cu, new Lu(99), new eu(du, G, 95), new Fu(90), new Gu(G, 85, 17), new Eu, new Du(60, 10), new Bu(60, 10), new Cu(60, 10), new Au(60, 10), new uu]
    }
},
$u = {};
$u[0] = Pu;
$u[6] = Qu;
$u[2] = Ru;
$u[7] = Tu;
$u[8] = Xu;
$u[1] = Vu;
$u[3] = Wu;
$u[4] = Su;
$u[9] = Yu;
$u[10] = Uu;
$u[11] = Zu;
var av = [Pu, Qu, Ru, Su, Tu, Uu, Vu, Wu, Xu, Yu, Zu],
Wh = {
    pa: 12,
    Ka: "Monster",
    bF: 50,
    cF: 160,
    kc: null,
    tb: null,
    Ma: null
},
bv = {
    pa: 0,
    Ka: "Scroll Character",
    d: "",
    za: "Scroll Character",
    yb: "Scroll Character Description",
    Le: 0,
    fe: !1,
    tb: [{
        r: "230",
        s: 1
    },
    {
        r: "231",
        s: 2
    },
    {
        r: "232",
        s: 3
    },
    {
        r: "233",
        s: 4
    },
    {
        r: "234",
        s: 5
    },
    {
        r: "235",
        s: 6
    }],
    Ma: {
        Xf: 1.2,
        Qf: 1,
        Rf: 500,
        Zf: 1,
        Cf: 1,
        Ef: 1
    }
};
var cv = {
    pa: 0,
    oi: !1,
    Ka: "Wolf",
    d: "Wolf.PNG",
    za: "Howler",
    yb: "A cool wolf that fights for a time.",
    Oi: -1,
    tb: [{
        r: "230",
        s: 1
    },
    {
        r: "231",
        s: 2
    },
    {
        r: "232",
        s: 3
    },
    {
        r: "233",
        s: 4
    },
    {
        r: "234",
        s: 5
    },
    {
        r: "235",
        s: 6
    }],
    Ma: Ou,
    kc: null,
    nb: function() {
        return [new fu(Yh, 90, 2, !1), new Eu, new Du(60, 10), new Bu(60, 10), new Cu(60, 10), new Au(60, 10), new uu]
    }
},
dv = {
    pa: 0,
    oi: !1,
    Ka: "Skeleton",
    d: "SkeletonFighter3.PNG",
    za: "Bones",
    yb: "A Skeletal Warrior.",
    Oi: -1,
    tb: [{
        r: "230",
        s: 1
    },
    {
        r: "231",
        s: 2
    },
    {
        r: "232",
        s: 3
    },
    {
        r: "233",
        s: 4
    },
    {
        r: "234",
        s: 5
    },
    {
        r: "235",
        s: 6
    }],
    Ma: Ou,
    kc: null,
    nb: function() {
        return [new fu(Yh, 90, 2, !1), new Eu, new Du(60, 10), new Bu(60, 10), new Cu(60, 10), new Au(60, 10), new uu]
    }
},
ev = {
    pa: 0,
    oi: !1,
    Ka: "Chicken",
    d: "Chicken1.PNG",
    za: "Chicken",
    yb: "A chicken.",
    Oi: -1,
    tb: [{
        r: "230",
        s: 1
    },
    {
        r: "231",
        s: 2
    },
    {
        r: "232",
        s: 3
    },
    {
        r: "233",
        s: 4
    },
    {
        r: "234",
        s: 5
    },
    {
        r: "235",
        s: 6
    }],
    Ma: Ou,
    kc: null,
    nb: function() {
        return [new fu(Yh, 90, 2, !1), new Eu, new Du(60, 10), new Bu(60, 10), new Cu(60, 10), new Au(60, 10), new uu]
    }
},
fv = {
    pa: 1,
    oi: !1,
    Ka: "Chicken",
    d: "Chicken1.PNG",
    za: "Chicken",
    yb: "A chicken.",
    Oi: -1,
    tb: [{
        r: "230",
        s: 1
    },
    {
        r: "231",
        s: 2
    },
    {
        r: "232",
        s: 3
    },
    {
        r: "233",
        s: 4
    },
    {
        r: "234",
        s: 5
    },
    {
        r: "235",
        s: 6
    }],
    Ma: Ou,
    jl: [qq.wB],
    Bp: [],
    nb: function() {
        return [new ou(Yh, 100), new fu(Yh, 90, 2, !1), new Eu, new Du(60, 10), new Bu(60, 10), new Cu(60, 10), new Au(60, 10), new uu]
    }
},
gv = {
    pa: 8,
    oi: !1,
    Ka: "Chicken",
    d: "Chicken1.PNG",
    za: "Chicken",
    yb: "A chicken.",
    Oi: -1,
    tb: [{
        r: "29",
        s: 3
    },
    {
        r: "62",
        s: 1
    },
    {
        r: "89",
        s: 4
    },
    {
        r: "186",
        s: 2
    },
    {
        r: "5",
        s: 5
    },
    {
        r: "33",
        s: 6
    }],
    Ma: Ou,
    jl: [tq.Hx],
    Bp: [{
        g: 1,
        f: 28
    }],
    nb: function() {
        return [new pu(G, 95), new eu(du, G, 90), new fu(G, 85, Kq, !1), new Eu, new Du(60, 10), new Bu(60, 10), new Cu(60, 10), new Au(60, 10), new uu]
    }
},
hv = {
    pa: 7,
    oi: !1,
    Ka: "Chicken",
    d: "Chicken1.PNG",
    za: "Chicken",
    yb: "A chicken.",
    Oi: -1,
    tb: [{
        r: "24",
        s: 3
    },
    {
        r: "25",
        s: 4
    },
    {
        r: "61",
        s: 1
    },
    {
        r: "84",
        s: 2
    },
    {
        r: "100",
        s: 5
    },
    {
        r: "88",
        s: 6
    }],
    Ma: Ou,
    jl: [pq.IB],
    Bp: [],
    nb: function() {
        return [new iu(100), new ku(du, G, 95), new hu(95), new Eu, new Du(60, 10), new Bu(60, 10), new Cu(60, 10), new Au(60, 10), new uu]
    }
},
iv = {
    pa: 2,
    oi: !0,
    Ka: "Death Chicken",
    d: "Chicken2.PNG",
    za: "Death Chicken",
    yb: "A death chicken.",
    Oi: -1,
    tb: [{
        r: "60",
        s: 1
    },
    {
        r: "23",
        s: 3
    },
    {
        r: "83",
        s: 2
    },
    {
        r: "143",
        s: 5
    },
    {
        r: "3",
        s: 4
    }],
    Ma: Nu,
    kc: null,
    Bp: [{
        g: 2,
        f: 23
    },
    {
        g: 40,
        f: 24
    }],
    nb: function() {
        return [new Ju(160, 100), new Ku(G, 160, 95, Kq), new fu(G, 65, Kq, !1), new Eu, new Du(60, 10), new Bu(60, 10), new Cu(60, 10), new Au(60, 10), new uu]
    }
},
jv = {
    pa: 3,
    oi: !0,
    Ka: "Phantom Skull",
    d: "PhantomSkull.PNG",
    za: "Kryptax",
    yb: "Floating Skull of Death.",
    Oi: -1,
    tb: [{
        r: "230",
        s: 1
    },
    {
        r: "231",
        s: 2
    },
    {
        r: "232",
        s: 3
    },
    {
        r: "233",
        s: 4
    },
    {
        r: "234",
        s: 5
    },
    {
        r: "235",
        s: 6
    }],
    Ma: Mu,
    kc: null,
    jl: [kq.br, mq],
    Bp: [{
        g: 3,
        f: 21
    }],
    nb: function() {
        return [new Ju(160, 100), new mu(G, 95), new qu(G, 85, 4), new Eu, new Du(60, 10), new Bu(60, 10), new Cu(60, 10), new Au(60, 10), new uu]
    }
},
kv = {};
kv[sq.LB.ta] = {
    pa: 6,
    oi: !0,
    Ka: "Dog",
    d: "DogWhite.PNG",
    za: "Scruffy",
    yb: "His bite is bigger than his bark.",
    Oi: -1,
    tb: [{
        r: "230",
        s: 1
    },
    {
        r: "231",
        s: 2
    },
    {
        r: "232",
        s: 3
    },
    {
        r: "233",
        s: 4
    },
    {
        r: "234",
        s: 5
    },
    {
        r: "235",
        s: 6
    }],
    Ma: Nu,
    kc: null,
    jl: [nq.$z, nq.Zz],
    nb: function() {
        return [new Ju(160, 100), new Ku(Yh, 160, 90, 2), new tu(G, 8, 35), new tu(G, 5, 30), new Eu, new Du(60, 10), new Bu(60, 10), new Cu(60, 10), new Au(60, 10), new uu]
    }
};
kv[sq.PB.ta] = cv;
kv[rq.OB.ta] = dv;
kv[rq.NB.ta] = jv;
kv[uq.KB.ta] = ev;
kv[uq.MB.ta] = iv;
function lv() {
    this.eh = []
}
function mv() {
    var a = w.Ni;
    0 < a.eh.length && (a.eh.length = 0)
}
lv.prototype.Lp = function(a) {
    if (a) {
        var b = this.eh.indexOf(a); - 1 < b && this.eh.splice(b, 1);
        b = w.$h;
        a = b.Pf.indexOf(a); - 1 < a && b.Pf.splice(a, 1)
    }
};
lv.prototype.Tt = function(a) {
    this.eh.push(a);
    w.$h.Tt(a)
};
var ni = [{
    pa: 0,
    Ka: "Guardian Fighter",
    Ws: !1,
    d: "HumanFighter33.PNG",
    za: "Zog",
    yb: "",
    fe: !1,
    tb: [{
        r: "230",
        s: 1
    },
    {
        r: "231",
        s: 2
    },
    {
        r: "232",
        s: 3
    },
    {
        r: "233",
        s: 4
    },
    {
        r: "234",
        s: 5
    },
    {
        r: "235",
        s: 6
    }],
    Ma: Nu,
    kc: null,
    nb: function() {
        return [new fu(Yh, 90, 2, !1), new Yt(1)]
    },
    Jm: [],
    Nr: []
},
{
    pa: 3,
    Ka: "Guardian Mage",
    Ws: !1,
    d: "HumanMage11.PNG",
    za: "Zar",
    yb: "",
    fe: !1,
    tb: [{
        r: "26",
        s: 1
    },
    {
        r: "85",
        s: 2
    },
    {
        r: "121",
        s: 4
    },
    {
        r: "160",
        s: 5
    },
    {
        r: "140",
        s: 3
    },
    {
        r: "182",
        s: 6
    }],
    Ma: Mu,
    kc: null,
    nb: function() {
        return [new eu(du, G, 95), new mu(G, 90), new qu(G, 85, 4), new Yt(1)]
    },
    Jm: [kq.br, mq],
    Nr: [{
        g: 1,
        f: 21
    }]
},
{
    pa: 2,
    Ka: "Elven Archer",
    Ws: !1,
    d: "HB_Elvenarcher1.PNG",
    za: "Seth",
    yb: "",
    fe: !1,
    tb: [{
        r: "60",
        s: 1
    },
    {
        r: "23",
        s: 3
    },
    {
        r: "83",
        s: 2
    },
    {
        r: "143",
        s: 5
    },
    {
        r: "3",
        s: 4
    }],
    Ma: Nu,
    kc: null,
    YE: null,
    nb: function() {
        return [new eu(du, G, 95), new fu(G, 90, Kq, !1), new Yt(1)]
    },
    Jm: [],
    Nr: [{
        g: 1,
        f: 23
    },
    {
        g: 40,
        f: 24
    }]
},
{
    pa: 8,
    Ka: "Ninja Warrior",
    Ws: !1,
    d: "Ninja.PNG",
    za: "N",
    yb: "",
    fe: !1,
    tb: [{
        r: "29",
        s: 3
    },
    {
        r: "62",
        s: 1
    },
    {
        r: "89",
        s: 4
    },
    {
        r: "186",
        s: 2
    },
    {
        r: "5",
        s: 5
    },
    {
        r: "33",
        s: 6
    }],
    Ma: {
        Xf: 1.1,
        Qf: 0.8,
        Rf: 1.1,
        Zf: 1.1,
        Cf: 0.8,
        Ef: 1.1
    },
    kc: null,
    nb: function() {
        return [new pu(G, 95), new eu(du, G, 90), new fu(G, 85, Kq, !1), new Yt(1)]
    },
    Jm: [tq.Hx],
    Nr: [{
        g: 15,
        f: 17
    },
    {
        g: 2,
        f: 18
    },
    {
        g: 25,
        f: 19
    },
    {
        g: 2,
        f: 10
    },
    {
        g: 1,
        f: 28
    }]
}];
var ei = [{
    d: "CubeGelatinous.PNG",
    Ia: "Gelatinous Cube"
},
{
    d: "FrogGiantGreen.PNG",
    Ia: "Green Frog"
},
{
    d: "OgreBlack.PNG",
    Ia: "Black Ogre"
},
{
    d: "OrcRedKing.PNG",
    Ia: "Orc King"
},
{
    d: "XornBlades.PNG",
    Ia: "Xorn"
},
{
    d: "GolemBrownStick.PNG",
    Ia: "Brown Golem"
},
{
    d: "GolemDragonRed.PNG",
    Ia: "Red Dragon Golem"
},
{
    d: "GolemElectric.PNG",
    Ia: "Golem"
},
{
    d: "GiantTwoHeaded.PNG",
    Ia: ""
},
{
    d: "GiantCloud.PNG",
    Ia: ""
},
{
    d: "GiantFire.PNG",
    Ia: ""
},
{
    d: "GiantFrost.PNG",
    Ia: ""
},
{
    d: "DrakeGiantWhite.PNG",
    Ia: ""
},
{
    d: "DrakeGiantRed2.PNG",
    Ia: ""
},
{
    d: "DrakeGiantGrey.PNG",
    Ia: ""
},
{
    d: "DrakeGiantBronze.PNG",
    Ia: ""
},
{
    d: "DragonGiantBoneRed.PNG",
    Ia: ""
},
{
    d: "DragonGiantBoneGrey.PNG",
    Ia: ""
},
{
    d: "DragonAncientLordBlack.PNG",
    Ia: ""
},
{
    d: "DragonAncientLordGreen.PNG",
    Ia: ""
},
{
    d: "DragonAncientLordRed.PNG",
    Ia: ""
},
{
    d: "Pheonix.PNG",
    Ia: ""
},
{
    d: "Race14Grey.PNG",
    Ia: ""
},
{
    d: "SkeletonKing.PNG",
    Ia: ""
},
{
    d: "SpiritFire.PNG",
    Ia: ""
},
{
    d: "SpriteFire.PNG",
    Ia: ""
},
{
    d: "TrollWater.PNG",
    Ia: ""
},
{
    d: "TrollKing.PNG",
    Ia: ""
},
{
    d: "TrollZombie.PNG",
    Ia: ""
},
{
    d: "Unique7.PNG",
    Ia: ""
},
{
    d: "WarElephantBrown.PNG",
    Ia: ""
},
{
    d: "WarElephantGrey.PNG",
    Ia: ""
},
{
    d: "Xorn4Armed.PNG",
    Ia: ""
},
{
    d: "AngelRed.PNG",
    Ia: ""
},
{
    d: "ElementalStone.PNG",
    Ia: ""
},
{
    d: "GolemBrownCaped.PNG",
    Ia: ""
},
{
    d: "GryphonRed.PNG",
    Ia: ""
},
{
    d: "Hydra10HeadRed.PNG",
    Ia: ""
}],
gi = {
    pa: 0,
    Ka: "Boss",
    Ws: !1,
    za: "Boss",
    yb: "",
    fe: !1,
    tb: [{
        r: "230",
        s: 1
    },
    {
        r: "231",
        s: 2
    },
    {
        r: "232",
        s: 3
    },
    {
        r: "233",
        s: 4
    },
    {
        r: "234",
        s: 5
    },
    {
        r: "235",
        s: 6
    }],
    Ma: {
        Xf: 1.7,
        Qf: 1.1,
        Rf: 1.6,
        Zf: 1,
        Cf: 10,
        Ef: 1.5
    },
    kc: null,
    nb: function() {
        return [new fu(Yh, 90, 2, !1), new Yt(1)]
    },
    eu: [],
    WC: [{
        g: 30,
        f: 17
    },
    {
        g: 2,
        f: 18
    },
    {
        g: 40,
        f: 19
    },
    {
        g: 3,
        f: 10
    }]
};
function nv() {
    this.Ye = "合意的;充足的;愉快的;适当的;权利的;平均的;忍受的;青铜的;基础的;常规的;普通的;合金的;平凡的;习惯的;正派的;减少的;日常的;精巧的;公平的;良好的;一般的;园艺的;中间的;未完的;钢铁的;可以的;平凡的;温和的;谦虚的;普通的;美好的;平凡的;尚可的;维持的;愉快的;清楚的;古雅的;可敬的;平庸的;规则的;有关的;卓越的;必须的;合理的;日常的;满意的;库存的;简单的;规范的;相配的;适当的;足够的;标准的;耐用的;可以的;变色的;典型的;普通的;平凡的;有益的;惯例的;达标的;兰花的;值得的".split(";");
    this.ih = "合格 适当 正派 熟悉 瑕疵 常态 重视 整齐 日常 适合 朴素 适用 有效".split(" ");
    this.hf = ["平均", "民众", "普通", "人民"]
}
nv.prototype.Uo = function() {
    var a = Math.random();
    return 0.3 > a ? ov: 0.6 > a ? 0.5 > Math.random() ? pv: qv: 0.5 > Math.random() ? rv: sv
};
nv.prototype.Tk = function() {
    return this.Ye[k(this.Ye.length)]
};
nv.prototype.Fm = function() {
    return this.ih[k(this.ih.length)]
};
nv.prototype.Gm = function() {
    return this.hf[k(this.hf.length)]
};
function tv() {
    this.Ye = "受膏的 全能的 天使的 天上的 神圣的 神化的 飘渺的 尊贵的 禁止的 美好的 史诗的 无双的 奇迹的 完美的 不朽的 高贵的 赞美的 凶残的 神奇的 拔群的 正义的 庄严地 圣洁的 透明的 卓越的 超脱的 怪异的 无情的 邪恶的 贞洁的 非常的".split(" ");
    this.ih = "敬畏 末日 灭绝 灾难 毁坏 屠杀 信仰 自由 财富 虚幻 浩劫 天堂 不朽 拯救 星尘 复仇 英勇".split(" ");
    this.hf = "岁月;远古;天启;鲁莽;全能;有福;神选;灾难;忘却;禁止;神明;女神;屠杀;迷雾;月色;月光;苍月;纯净;正义;天空;太阳;星辰;神道;暗影;星光;无畏;无惧;无双;贤惠;冷风".split(";")
}
tv.prototype.Uo = function() {
    var a = Math.random();
    return 0.25 > a ? ov: 0.5 > a ? 0.5 > Math.random() ? pv: qv: 0.5 > Math.random() ? rv: sv
};
tv.prototype.Tk = function() {
    return this.Ye[k(this.Ye.length)]
};
tv.prototype.Fm = function() {
    return this.ih[k(this.ih.length)]
};
tv.prototype.Gm = function() {
    return this.hf[k(this.hf.length)]
};
function uv() {
    this.Ye = "可怕的;惊人的;诧异的;美丽的;神佑的;经典的;优雅的;精致的;奢侈的;非凡的;卓越的;完美的;凶猛的;可怕的;金典的;光荣的;高级的;出名的;高档的;可爱的;豪华的;神秘的;高贵的;华丽的;珍贵的;完善的;最初的;额外的;卓越的;精粹的;稀有的;单一的;生命的;显著地;轰动的;至高的;无上的;精彩的".split(";");
    this.ih = "惊愕;恐惧;爆炸;轻松;附击;附伤;火焰;霜冻;烈焰;残暴;迷恋;噩梦;荣耀;魔力;炫目;伟大;幸福;冰块;玩笑;惩罚;纯洁;希望;完美;恐怖;折磨;奇迹;惊叹".split(";");
    this.hf = "深渊 黎明 大地 畏惧 无谓 遗忘 强硬 勇敢 衰弱 英勇".split(" ")
}
uv.prototype.Uo = function() {
    var a = Math.random();
    return 0.25 > a ? ov: 0.5 > a ? 0.5 > Math.random() ? pv: qv: 0.5 > Math.random() ? rv: sv
};
uv.prototype.Tk = function() {
    return this.Ye[k(this.Ye.length)]
};
uv.prototype.Fm = function() {
    return this.ih[k(this.ih.length)]
};
uv.prototype.Gm = function() {
    return this.hf[k(this.hf.length)]
};
function vv() {
    this.Ye = "可敬的;平衡的;合金的;选择的;很好的;合意的;特色的;精巧的;幻想的;稳固的;一流的;超流的;残忍的;强大的;良好的;英勇的;坚硬的;沉重的;英俊的;诚实的;敏锐的;品牌的;非凡的;抛光的;领袖的;可贵的;素质的;文雅的;卓越的;皇家的;光泽的;金属的;严厉的;选择的;特殊的;结实的;炫耀的;坚定的;优胜的;锐利的;雅致的;顶尖的;罕见的;健康的".split(";");
    this.ih = "冒险 勇敢 胆量 信任 决心 破坏 恐惧 惊骇 霜冻 友谊 预兆 沉闷 强烈 公正 敏锐 复仇 坚持 毅力 平静 预言 刺骨 疼痛 欢笑 勇气 恶意 明星 精神 胜利 暴力 伤害".split(" ");
    this.hf = "大胆 英勇 起泡 勇敢 大胆 注定 华丽 无畏 黑暗 沉醉 公正 大量 虐待 侵略 徒劳 征服 自愿".split(" ")
}
vv.prototype.Uo = function() {
    var a = Math.random();
    return 0.3 > a ? ov: 0.5 > a ? 0.5 > Math.random() ? pv: qv: 0.5 > Math.random() ? rv: sv
};
vv.prototype.Tk = function() {
    return this.Ye[k(this.Ye.length)]
};
vv.prototype.Fm = function() {
    return this.ih[k(this.ih.length)]
};
vv.prototype.Gm = function() {
    return this.hf[k(this.hf.length)]
};
function wv() {
    this.Ye = "惊骇的;非典的;灿烂的;定制的;狡猾的;聪明的;勇敢的;大胆的;特色的;独家的;天才的;史诗的;手工的;无双的;孤独的;残忍的;奇迹的;独特的;绝伦的;正义的;聪慧的;特殊的;奇异的;邪恶的;勇敢的;徒劳的".split(";");
    this.MA = "绝对 诧异 勇敢 独裁 非凡 先天 惊人 陶醉 失真 巨大 神秘 完美 卓越 精粹 超级 合计 奇迹 神话 独步 无敌 无尽 超常 空前 无比 无双 危难 超脱".split(" ");
    this.NA = "看法 冒险 勇气 信任 冷静 毁灭 荒废 效能 凶猛 荣誉 魅力 伟大 紧张 权利 完美 坚持 毅力 品质 柔滑 风格 精神 胜利 暴力 奇迹".split(" ");
    this.hf = ["专家"]
}
wv.prototype.Uo = function() {
    return rv
};
wv.prototype.Tk = function() {
    return this.Ye[k(this.Ye.length)]
};
wv.prototype.Fm = function() {
    return this.MA[k(this.MA.length)] + "" + this.NA[k(this.NA.length)]
};
wv.prototype.Gm = function() {
    return this.hf[k(this.hf.length)]
};
var ov = 1,
pv = 2,
qv = 3,
rv = 4,
sv = 5;
function xv() {
    this.$y = new nv;
    this.LE = new vv;
    this.lE = new uv;
    this.BD = new tv;
    this.UE = new wv
}
function yv(a, b) {
    switch (b.Uo()) {
    case 0:
        return a;
    case ov:
        return b.Tk() + "" + a;
    case pv:
        return b.Fm() + "之" + a;
    case qv:
        return b.Gm() + "之" + a;
    case rv:
        return b.Fm() + "之" + b.Tk() + a;
    case sv:
        return b.Gm() + "之" + b.Tk() + a;
    default:
        return a
    }
};
function zv(a, b, c, d) {
    this.item = a;
    this.mp = b;
    this.np = c;
    this.PD = d;
    this.gc = !1;
    this.Zc = null;
    this.ph = 0
}
e = zv.prototype;
e.getItem = function() {
    return this.item
};
e.oh = function(a) {
    this.gc = a
};
e.Re = function(a) {
    this.Zc = a
};
e.Ud = function() {
    return this.ph
};
e.Se = function(a) {
    this.ph = a
};
var Av = 1,
Bv = 2,
Cv = 3,
Dv = 4,
Ev = 5;
function Fv(a, b, c, d) {
    this.Dw = a;
    this.LD = b;
    this.MD = c;
    this.ms = d
};
function Gv() {
    this.xm = [];
    this.xm[Av] = {
        description: "Fire Damage",
        ca: "Red Damage"
    };
    this.xm[Bv] = {
        description: "Ice Damage",
        ca: "White Damage"
    };
    this.xm[Cv] = {
        description: "Poison Damage",
        ca: "Green Damage"
    };
    this.xm[Dv] = {
        description: "Shock Damage",
        ca: "Electric Damage"
    };
    this.xm[Ev] = {
        description: "Sonic Damage",
        ca: "Sonic Damage"
    }
};
function Hv(a, b, c, d, f, g, h, l, n) {
    this.RD = a;
    this.fa = b;
    this.Z = c;
    this.Xn = n; (this.lA = w.Kj.v(d)) || console.log("error. invalid item sprite: " + d);
    this.na = f;
    this.ma = g;
    this.la = h;
    this.SC = l
}
Hv.prototype.Uk = function() {
    return this.lA
};
Hv.prototype.sw = function() {
    return this.Xn
};
Hv.prototype.Cw = function() {
    return this.SC
};
function Iv(a, b, c, d, f, g, h, l, n, p) {
    this.op = a;
    this.r = b;
    this.pa = c;
    this.Ew = d;
    this.kA = g;
    this.ns = f;
    this.zf = h;
    this.va = l;
    this.s = n;
    this.Rm = p;
    this.nj = null
}
Iv.prototype.Uk = function() {
    return this.op.Uk()
};
Iv.prototype.sw = function() {
    return this.op.sw()
};
Iv.prototype.uf = function() {
    return this.kA
};
Iv.prototype.Cw = function() {
    return this.op.Cw()
};
function ss(a, b) {
    return ! b || a.va > b.va
}
function Jv(a) {
    switch (a.s) {
    case 2:
        return "护甲";
    case 3:
        return "攻击等级";
    case 4:
        return "防御等级";
    case 5:
        return "最大生命";
    case 6:
        return "最大法力";
    case 1:
        if (a.Rm) switch (a.Rm.Dw) {
        case Av:
            return "火焰伤害";
        case Bv:
            return "冰霜伤害";
        case Cv:
            return "毒药伤害";
        case Dv:
            return "休克伤害";
        case Ev:
            return "音波伤害";
        default:
            return "伤害"
        } else return "伤害";
    default:
        return "Error"
    }
}
function Kv(a) {
    switch (a.kA) {
    case 0:
        return "普通";
    case 1:
        return "罕见";
    case 2:
        return "稀有";
    case 3:
        return "历史";
    case 4:
        return "远古";
    default:
        return "BUG FOUND: " + a.uf()
    }
}
function Lv(a) {
    var b = a.op.fa;
    a = a.Ew;
    var c = a.indexOf(b);
    return - 1 === c ? a: a.substring(0, c) + '<span style="color:#FAF;">' + b + "</span>" + a.substring(c + b.length)
};
function Mv() {
    this.OD = new xv;
    this.ND = new Gv;
    this.ps = {};
    this.os = {}
}
function Nv(a, b, c, d, f) {
    var g; (g = a.ps[b]) || console.log("ItemGenerator.getRandomItemType() failed to find item types for slot: " + b);
    0 === g.length ? (console.log("ItemGenerator.getRandomItemType() no item types for slot: " + b), g = null) : g = g[k(g.length)];
    if (!g) return null;
    var h;
    a: {
        var l, n;
        for (l = 0; l < Ov.length; l++) if (n = Ov[l], n.Vp === f) {
            h = n;
            break a
        }
        h = Ov[0]
    }
    var p = null;
    l = c.KD[b];
    var s = Pv(c, l) * h.pp;
    n = Oa(d, Qv, s);
    s = Oa(d, Rv, s) * ir.t;
    if (1 === l && Math.random() < h.jp) {
        p = a.ND;
        h = Math.random();
        h = 0.2 > h ? Av: 0.4 > h ? Bv: 0.6 > h ? Dv: 0.7 > h ? Ev: Cv;
        var u = m(Math.max(0.1 * n, 0.4 * n * Math.random()));
        1 > u && (u = 1);
        p = p.xm[h];
        p = new Fv(h, u, "+" + r(u) + " " + p.description, p.ca)
    }
    a = a.OD;
    switch (f) {
    case 0:
        a = a.$y;
        break;
    case 1:
        a = a.LE;
        break;
    case 2:
        a = a.lE;
        break;
    case 3:
        a = a.BD;
        break;
    case 4:
        a = a.UE;
        break;
    default:
        a = a.$y
    }
    a = yv(g.fa, a);
    b = new Iv(g, b, c.pa, a, d, f, s, n, l, p);
    b.nj = c;
    return b
}
function Pv(a, b) {
    var c = a.Kc.Ma;
    if (!c) return 1;
    switch (b) {
    case 2:
        return c.Qf;
    case 1:
        return c.Xf;
    case 3:
        return c.Rf;
    case 4:
        return c.Zf;
    case 5:
        return c.Cf;
    case 6:
        return c.Ef
    }
}
function Sv(a, b) {
    if (Math.random() < Tv) return Math.max(1, a - 1);
    var c = Math.min(1, Uv + b);
    return Math.random() < c ? a + 1 : a
}
function L(a, b, c) {
    var d = b.fa + c;
    var f = 0,
    g, h;
    if (0 !== d.length) for (g = 0; g < d.length; g++) h = d.charCodeAt(g),
    f = (f << 5) - f + h,
    f |= 0;
    g = f + "";
    f = b.Z;
    b = new Hv(g, b.fa, f, c, b.na, b.ma, b.la, b.oa, b.Xn);
    a.os[g] && console.log("item type hash collision: " + d);
    a.os[g] = b;
    for (g = 0; g < f.length; g++) d = f[g],
    c = a.ps[d],
    c || (c = [], a.ps[d] = c),
    c.push(b)
}
Mv.prototype.uf = function(a) {
    var b = 0,
    c = Math.random() * a;
    for (a = Vv.length - 1; 0 <= a; a--) {
        b = Vv[a];
        if (c < b) return a;
        c -= b
    }
    return 0
};
function Wv() {
    this.yf = []
}
function $d() {
    var a = w.dh;
    0 < a.yf.length && (a.yf.length = 0)
}
Wv.prototype.zl = function() {
    var a;
    for (a = 0; a < this.yf.length; a++) this.yf[a].Re(null),
    this.yf[a].Se(0)
};
function Xv(a, b, c, d, f) {
    var g;
    g = w.Sm;
    var h = w.i.D[k(w.i.D.length)],
    l = h.Z,
    l = l[k(l.length)],
    n = g.uf((100 - E.Yl.t) / 100);
    f = Sv(f, (100 - E.lp.t) / 100); (g = Nv(g, l, h, f, n)) && a.yf.push(new zv(g, b, c, d))
}
function Yv(a) {
    var b = w.dh;
    a = b.yf.indexOf(a); - 1 < a && b.yf.splice(a, 1)
};
function Zv() {
    this.items = [];
    this.vp = $v + Math.min(aw, w.i.wh);
    this.Bw = null;
    this.ip = !1
}
function bw(a, b) {
    if (a.items.length < a.vp) b.nj = a.Bw,
    a.items.push(b),
    a.ip = !0,
    cw(w.Di, a.items);
    else {
        var c, d = -1,
        f = 0,
        g;
        for (c = 0; c < a.items.length; c++) g = a.items[c],
        0 > d ? (d = 0, f = g.zf) : f > g.zf && (d = c, f = g.zf);
        c = d; - 1 < c && ss(b, a.items[c]) && (dw(a, c), b.nj = a.Bw, a.items.push(b), a.ip = !0, cw(w.Di, a.items))
    }
}
Zv.prototype.removeItem = function(a) {
    dw(this, this.items.indexOf(a))
};
function dw(a, b) { - 1 !== b && (a.items[b].nj = null, a.items.splice(b, 1), a.ip = !0)
};
function ew() {
    this.Fj = [];
    this.IE = function(a, b) {
        return b.zf - a.zf
    }
}
function cw(a, b) { ! b || 2 > b.length || b.sort(a.IE)
}
ew.prototype.Br = function(a) {
    var b = a.Ld.items;
    if (b && 0 !== b.length) {
        var c, d, f = [];
        for (c = 0; c < b.length; c++) f.push(b[c]);
        for (c = 0; c < f.length; c++) b = f[c],
        (d = a.ef(b.r)) && !ss(b, d) || a.Qk(b)
    }
};
ew.prototype.Wt = function(a) {
    var b = a.Ld.items;
    if (!b || 0 === b.length) return ! 1;
    var c, d, f;
    for (c = 0; c < b.length; c++) if (d = b[c], f = a.ef(d.r), !f || ss(d, f)) return ! 0;
    return ! 1
};
function fw() {
    this.Jc = 0;
    this.yd = this.Vn = this.Rd = !1;
    this.xb = this.Xb = this.Ca = this.Da = this.Ib = null;
    this.ut = this.Xs = !1;
    this.Df = this.Ys = 0;
    this.pl = null
}
fw.prototype.Cb = function(a) {
    this.Da = a
};
fw.prototype.Ir = function() {
    return this.Ys
};
function gw(a, b, c, d) {
    a = qi(a);
    if (0 === a.length) return null;
    var f = b.p.w;
    if (!f) return null;
    var g, h = b.p.u,
    l, n = [];
    for (b = 0; b < a.length && (g = a[b], g.Va || g.p.w !== f || (l = h.ac(g.p.u), !(l <= d && (n.push(g), n.length >= c)))); b++);
    return n
};
function hw() {
    this.kj = []
}
function iw() {
    var a = w.Xe;
    0 < a.kj.length && (a.kj.length = 0)
}
function jw(a, b) {
    var c = b.xb;
    if (c && !c.Cj) {
        if (b.Rd) return b.Vn = !0;
        pc(w.df, c);
        var d = b.Ib;
        d && d.td && kw(a, b);
        0 < b.Jc && rh(b.Da, b.Jc);
        b.Xs ? (d = lw(b)) && mw(a, d) : b.ut && (d = nw(b)) && mw(a, d)
    }
    if ((d = b.xb) && d.bx !== d.oc) {
        var f = d.To();
        if (b.Ib) {
            var g = b.Da,
            h = b.Ib,
            l = h.ga;
            if (g) if (d = g.K, 4 === l || 5 === l || 8 === l || 13 === l || 12 === l) ow(b);
            else if (1 === l && (h = h.Ra, l = $h(d.Jb), d.Sa < l)) {
                var n = b.Ca.K.Ts;
                1 < n && (h = Math.min(100, h * n));
                f = Math.max(1, m(h / 100 * l / f));
                h = w.pc;
                0 < f && sh(h, g, "+" + f, "#00FF00");
                d.Sa += m(f);
                g = $h(d.Jb);
                d.Sa > g && (d.Sa = g)
            }
        } else 0 < b.Jc && ow(b)
    }
    return c && c.bl() ? ((c = b.Ib) && (c.td || kw(a, b)), b.Vn = !0) : !1
}
function kw(a, b) {
    var c = b.Ib,
    d = c.ga;
    if (2 === d || 3 === d) {
        var f = b.Ca,
        d = c.X,
        c = c.Ra,
        g = Li[d];
        if (g) {
            var f = f.K,
            h = 1;
            switch (d) {
            case 5:
                h = f.Ps;
                break;
            case 6:
                h = f.Rs;
                break;
            case 7:
                h = f.Qs;
                break;
            case 8:
                h = f.Ss
            }
            d = new pw(d, w.i.$a, g.Qd, w.Dj.Zg(g.vd), g.Od, g.Pd, 1 > h ? c: c * h)
        } else console.log("Failed to find char effect description: " + d),
        d = null;
        c = b.Da.Ja;
        d && (c.of.push(d), qw(d) && (c.Kd = !0))
    } else if (10 === d || 9 === d) rw(c, b.Ca, b.xb.xi);
    else if (11 === d) d = b.Ca,
    g = b.xb.xi,
    h = b.Da,
    f = w.Gf,
    h && (h = f.Og.indexOf(h), -1 < h && f.Og.splice(h, 1)),
    rw(c, d, g);
    else if (17 === d) c = b.Ca,
    d = b.xb.xi,
    h = c.K,
    g = h.ku,
    f = h.lu,
    h = h.mu,
    0 < g && Math.random() < g / 100 ? (g = fv, sh(w.pc, c, "野蛮人小鸡!", "blue")) : 0 < f && Math.random() < f / 100 ? (g = gv, sh(w.pc, c, "忍者小鸡!", "blue")) : 0 < h && Math.random() < h / 100 ? (g = hv, sh(w.pc, c, "盗贼小鸡!", "blue")) : g = ev,
    sw(g, c, d);
    else if (14 === d) {
        d = b.Ca.p.u;
        g = w.ff.pe;
        for (c = g.length - 1; 0 <= c; c--) f = g[c],
        f.gc || (h = new Za, t(h, f.Xo, f.Yo), h = new Zb("Gold Sparkles", d, h, !1, 1), pc(w.df, h), at(f.Xl), w.i.aa.dp(f.Xl), f.oh(!0), Fi(f), Kd(9));
        d = b.Ca.p.u;
        g = w.dh.yf;
        for (c = g.length - 1; 0 <= c; c--) if (h = g[c], !h.gc) {
            f = new Za;
            t(f, h.mp, h.np);
            f = new Zb("Blue Sparkles", d, f, !1, 1);
            pc(w.df, f);
            f = h.getItem();
            h.oh(!0);
            Yv(h);
            a: {
                h = void 0;
                for (h = 0; h < w.i.D.length; h++) if (w.i.D[h].pa === f.pa) {
                    h = w.i.D[h];
                    break a
                }
                console.log("failed to find item character");
                h = null
            }
            w.i.aa.ep(f);
            bw(h.Ld, f);
            Kd(12);
            f = f.uf();
            if (0 != f) switch (f) {
            case 1:
                Kd(13);
                break;
            case 2:
                Kd(14);
                break;
            case 3:
                Kd(15);
                break;
            case 4:
                Kd(16)
            }
        }
        d = b.Ca.p.u;
        g = w.Uh.kf;
        for (c = g.length - 1; 0 <= c; c--) f = g[c],
        f.gc || (h = new Za, t(h, f.bq, f.cq), h = new Zb("Pink Sparkles", d, h, !1, 1), pc(w.df, h), f.oh(!0), Oq(f), Cq(f.vf()), Kd(10));
        d = b.Ca.p.u;
        g = w.Ti.Hf;
        for (c = g.length - 1; 0 <= c; c--) f = g[c],
        f.gc || (h = new Za, t(h, f.Qp, f.Rp), h = new Zb("Green Sparkles", d, h, !1, 1), pc(w.df, h), f.oh(!0), or(f), rr(f.hc), Kd(11))
    } else 15 === d ? a.wu(b) : 16 === d && (c = b.Da) && (c = c.Ja, c.Kf = !1, zh(c))
}
function rw(a, b, c) { (a = kv[a.ta]) ? sw(a, b, c) : console.log("Failed to find minion for summon spell.")
}
hw.prototype.wu = function(a) {
    if (a = Ji(w.th, a.Ca.p.w)) a.el = !0,
    w.i.da.hq(a)
};
function ow(a) {
    var b = a.Da,
    c = b.K,
    d = a.Jc;
    if (0 !== d) {
        var f = 1 + k(d - 1);
        0 !== f && (d = Math.max(0, d - f), a.Jc = d, c.Sa -= m(f), 0 > c.Sa && (c.Sa = 0), d = a.Ca, d = 1 === d.zb ? d.xg.K: d.K, d.rj += f, d = b.K, d.sj += f, 0 === c.Sa && tw(a.Ca, b))
    }
}
function tw(a, b) {
    if (b.zb === bt) {
        if (!b.Ja.Kf) {
            w.i.aa.Tr();
            b.Ja.Kf = !0;
            var c = b.p.u,
            d = new pw(13, w.i.$a, Ki.Qd, w.Dj.Zg(Ki.vd), Ki.Od, Ki.Pd, 0),
            c = new Zb(Ki.vd, c, c, !1, 1);
            b.K.vq++;
            var f = b.Ja;
            d && (f.of.push(d), qw(d) && (f.Kd = !0));
            c.uA = !0;
            c.ud = b;
            pc(w.df, c);
            sh(w.pc, b, "昏迷!", "white")
        }
    } else if (1 === b.zb) w.Qo.Lp(b);
    else if (4 === b.zb) {
        if (!b.Va) {
            var g = b.p,
            d = 1 === a.zb ? a.xg: a;
            $t(d) && (d.K.im++, Is(Yq.t), w.i.aa.cp(), 5 === d.zb && w.i.aa.gp(), 1 === a.zb && w.i.aa.$k(), d = b.Sb, uw(d.No * Zq.t), ui(d));
            var d = g.w,
            c = ug(d) + w.B,
            f = vg(d) - w.B,
            h = wg(d) + w.B,
            l = xg(d) - w.B,
            n = g.Ob(),
            p = g.Pb(),
            s = 10 + k(10),
            u;
            kr.t && (s *= 2);
            for (g = 0; g < s; g++) u = 1 + Dg(),
            u = new Eg(u, vw(n, c, f), vw(p, h, l), d),
            w.ff.pe.push(u);
            s = 7 + k(8);
            lr.t && (s *= 2);
            for (g = 0; g < s; g++) Xv(w.dh, vw(n, c, f), vw(p, h, l), d, b.K.Eb);
            s = 2 + k(5);
            for (g = 0; g < s; g++) u = w.nh.Pl,
            u = u[k(u.length)],
            u = new Mq(u, vw(n, c, f), vw(p, h, l), d),
            w.Uh.kf.push(u);
            s = 0 + k(2);
            for (g = 0; g < s && w.Yj.re.length < sr + tr.t; g++) u = new Tq(Sq[k(Sq.length)]),
            u = new mr(u, vw(n, c, f), vw(p, h, l), d),
            w.Ti.Hf.push(u);
            b.Va = !0;
            d = ww();
            b.ee = d;
            w.Gf.ol(b);
            w.i.Xg.ol();
            Ta("Boss Defeated", "等级:" + b.K.Eb);
            sh(w.pc, b, "击杀首领!", "white")
        }
    } else w.Qo.ol(a, b)
}
function mw(a, b) {
    a.kj.push(b)
};
function xw(a, b) {
    var c = a.K,
    d = c.Wn / 100,
    f = 0,
    g;
    for (g = 0; g < c.Oj; g++) if (Math.random() < d) f++;
    else break;
    if ((c = gw(a, a, 1 + f, b ? a === w.i.ce ? 100 * G: G: Yh)) && 0 !== c.length) for (d = 0; d < c.length; d++) yw(a, c[d], b)
}
function yw(a, b, c) {
    var d = new fw;
    d.Ca = a;
    d.Cb(b);
    if (12 == a.pa) c = b.p.u,
    a = zw(a, b),
    d.Jc = a,
    d.Rd = 0 === a,
    d.yd = !1,
    a = new Zb("Red Splat", c, c, !1, 1);
    else if (c) {
        c = b.p.u;
        var f = a.p.u,
        g = zw(a, b);
        b = a.Yg ? a.Yg.Ey: null;
        var h = a.So(),
        h = h ? h.Rm: null;
        d.Jc = g;
        d.Rd = 0 === g;
        d.yd = !0;
        g = "Red Splat";
        if (h) {
            var l = h.ms;
            l && (g = l);
            f = new Zb(Aw(b, h.Dw), f, c, !0, 1)
        } else f = new Zb(Aw(b, null), f, c, !0, 1);
        f.ud = a;
        d.Xb = f;
        a = a.K.Ir();
        0 < a && (d.Xs = !0, d.Df = a);
        a = new Zb(g, c, c, !1, 1)
    } else c = b.p.u,
    f = zw(a, b),
    b = (a = a.So()) ? a.Rm: null,
    a = null,
    d.Jc = f,
    d.Rd = 0 === f,
    d.yd = !1,
    b && (f = b.ms) && (a = new Zb(f, c, c, !1, 1)),
    a || (a = new Zb("Red Splat", c, c, !1, 1));
    d.xb = a;
    mw(w.Xe, d)
}
function Bw(a) {
    var b = a.Da;
    if (!b || b.Va) return null;
    var c = a.ld;
    if (!c) return null;
    var d = new fw;
    d.Ca = a;
    d.Cb(b);
    var f = b.p.u,
    g = a.p.u;
    d.Ib = c;
    d.yd = !0;
    var h = c.ya;
    h && (h = new Zb(h, g, f, !0, 1), h.ud = a, d.Xb = h);
    if (h = c.ca) f = new Zb(h, g, f, !1, 1),
    d.xb = f;
    c = c.ga;
    4 === c ? (b = zw(a, b), d.Rd = 0 === b, d.Jc = b) : 13 === c && (b = Math.max(1, zw(a, b)), d.Rd = !1, d.Jc = b);
    a = a.K;
    b = bu(a);
    Cw(a, b);
    mw(w.Xe, d);
    return d
}
function Dw(a, b) {
    var c = new Za,
    d = a.T,
    f = a.U,
    g = k(40),
    h = k(40),
    d = 0.5 >= Math.random() ? d + g: d - g,
    f = 0.5 >= Math.random() ? f + h: f - h;
    t(c, d, f);
    b && Fg(b, c, w.Nh);
    return c
}
function Ew(a, b, c, d, f, g, h) {
    a >= c && a <= d && b >= f && b <= g && (a = w.Ba.hb(a, b)) && sg(a, h)
}
function Aw(a, b) {
    if (3 === a.sw()) return "Ninja Star";
    if (b) switch (b) {
    case Av:
        return "Fire Arrow";
    case Bv:
        return "Ice Arrow";
    case Cv:
        return "Small Green Projectiles";
    case Dv:
        return "Lightning Arrow";
    case Ev:
        return "Green Arrow";
    default:
        return "Red Arrow"
    } else return "Red Arrow"
}
function zw(a, b) {
    var c = a.K,
    d = b.K,
    f = $h(c.xe),
    g = $h(c.sd),
    h = $h(d.Ae),
    l = $h(d.je),
    d = d.wo,
    c = c.lm;
    if (!b.Ja.Kd && Math.random() > f / (f + h)) return 0;
    if (0 < c && Math.random() < c / 100) return sh(w.pc, a, "暴击!", "#FFFF00"),
    g;
    f = m(l / 2);
    g -= f + k(f);
    return 0 >= g ? 0 : 0 < d ? Math.max(0, g - m(d / 100 * g)) : g
}
function Fw(a, b) {
    var c = a.K,
    d = $h(c.sd),
    f = $h(b.K.je),
    c = c.lm;
    if (0 < c && Math.random() < c / 100) return sh(w.pc, a, "暴击!", "#FFFF00"),
    d;
    f = m(f / 2);
    d -= f + k(f);
    return 0 >= d ? 0 : d
}
function lw(a) {
    var b = a.Ir(),
    c = a.Df;
    if (b >= c) return null;
    var d = Kt(a.Da);
    if (!d) return null;
    var f = a.Xb;
    if (!f) return null;
    var g = a.xb;
    if (!g) return null;
    var h = new fw,
    l = g.xi,
    n = d.p.u;
    h.Ca = a.Ca;
    h.Cb(d);
    g = new Zb(g.ca, l, n, !1, 1);
    h.xb = g;
    f = new Zb(f.ca, l, n, !0, 1);
    h.Xb = f;
    h.yd = !0;
    d = zw(a.Ca, d);
    h.Jc = d;
    h.Rd = 0 === d;
    h.Ib = a.Ib;
    h.Ys = b + 1;
    h.Xs = !0;
    h.Df = c;
    return h
}
function nw(a) {
    var b = a.Ir(),
    c = a.Df,
    d;
    if (b === c) {
        var f = new fw;
        f.Ca = a.Ca;
        f.Cb(a.Ca);
        f.yd = !0;
        f.Ib = a.Ib;
        f.ut = !0;
        f.Ys = 1;
        f.Df = 0;
        c = a.Xb;
        d = a.Ca.p.u;
        var g = a.pl,
        b = a.xb;
        f.Rd = !1;
        c && (c = new Zb(c.ca, d, g, !0, 1), c.Gs = !0, c.ud = a.Ca, f.Xb = c);
        a = new Zb(b.ca, d, g, !1, 1);
        f.xb = a;
        return f
    }
    if (b > c) return null;
    d = a.xb;
    if (!d) return null;
    g = Kt(a.Da);
    if (!g) return null;
    f = new fw;
    f.Ca = a.Ca;
    f.yd = !0;
    f.Ib = a.Ib;
    f.Ys = b + 1;
    f.ut = !0;
    f.Df = c;
    f.pl = a.pl;
    var h = a.Xb,
    b = d.xi,
    c = g.p.u;
    f.Cb(g);
    g = Fw(a.Ca, g);
    f.Jc = g;
    f.Rd = 0 === g;
    h && (g = new Zb(h.ca, b, c, !0, 1), g.Gs = !0, g.ud = a.Ca, f.Xb = g);
    a = new Zb(d.ca, b, c, !1, 1);
    f.xb = a;
    return f
};
function Gw(a) {
    this.no = a;
    this.wc = this.Xh = this.Pc = this.va = 0
}
function Hw(a, b) {
    a.Xh += b
}
function $h(a) {
    var b = a.va + a.Pc;
    return b + m((a.wc + a.Xh) / 100 * b)
};
function Iw(a) {
    this.no = a;
    this.Eb = 0;
    this.Am = 100;
    this.lm = this.mt = this.Yc = this.Sa = 0;
    this.Pr = 1;
    this.ot = 4;
    this.Tq = 12;
    this.vq = this.sj = this.rj = this.Ff = this.im = 0;
    this.gl = Jw;
    this.Df = this.ao = this.pq = this.ap = this.xn = this.wo = 0;
    this.Wi = Kw;
    this.Oj = 0;
    this.Wn = Lw;
    this.mu = this.lu = this.ku = this.Ss = this.Qs = this.Ps = this.Rs = this.Ts = this.nt = this.vt = this.ho = this.Qq = this.Ft = this.mr = this.ar = 0;
    this.sd = new Gw(a);
    this.je = new Gw(a);
    this.xe = new Gw(a);
    this.Ae = new Gw(a);
    this.Jb = new Gw(a);
    this.Ke = new Gw(a)
}
function Mw(a, b) {
    return b ? Math.max(4, a.Tq - a.ao + Xs.t) : Math.max(4, a.Tq - a.ao)
}
Iw.prototype.wx = function(a) {
    this.Ff = a
};
Iw.prototype.$k = function() {
    this.Ff++
};
function Cw(a, b) {
    fr.t || (a.Yc -= b, 0 > a.Yc && (a.Yc = 0))
}
function bu(a) {
    return Math.min(a.mt - (0 < a.xn ? m(a.xn / 100 * a.mt) : 0), $h(a.Ke))
}
function Gq() {
    var a = w.i.ce.K;
    a.Wi = 100;
    100 < a.Wi && (a.Wi = 100)
}
Iw.prototype.Ir = function() {
    var a = this.Wi / 100,
    b = 0,
    c;
    for (c = 0; c < this.Df; c++) if (Math.random() < a) b++;
    else break;
    return b
};
function Ni(a) {
    a.wo = 0;
    a.xn = 0;
    a.sd.wc = 0;
    a.je.wc = 0;
    a.xe.wc = 0;
    a.Ae.wc = 0;
    a.Jb.wc = 0;
    a.Ke.wc = 0;
    a.ap = 0;
    a.pq = 0;
    a.ao = 0;
    a.Ts = 0;
    a.Rs = 0;
    a.Ps = 0;
    a.Qs = 0;
    a.Ss = 0;
    a.Oj = 0;
    a.Wn = Lw;
    a.mr = 0;
    a.Ft = 0;
    a.ar = 0;
    a.lm = 0;
    a.ho = 0;
    a.Qq = 0;
    a.vt = 0;
    a.nt = 0;
    a.ku = 0;
    a.lu = 0;
    a.mu = 0;
    a.Df = 0;
    a.Wi = Kw;
    a.gl = Jw
};
function pw(a, b, c, d, f, g, h) {
    this.X = a;
    this.jD = b;
    this.Qd = c;
    this.hD = d;
    this.Od = f;
    this.bg = !1;
    this.Pd = g;
    this.Ok = h
}
pw.prototype.bl = function() {
    return this.bg
};
function qw(a) {
    return 0 === a.X || 1 === a.X || 13 === a.X || 14 === a.X
};
function Nw(a) {
    this.no = a;
    this.Kf = this.wg = this.bi = this.Vs = this.Gn = this.Kd = !1;
    this.of = []
}
function Ow(a, b) {
    var c, d = w.i.$a,
    f, g = !1,
    h, l = a.Kf;
    a.Kd = !1;
    a.Gn = !1;
    a.Vs = !1;
    a.bi = !1;
    a.wg = !1;
    a.Kf = !1;
    var n = a.no.K,
    p = n.sd,
    s = n.je,
    u = n.xe,
    y = n.Ae;
    s.Xh = 0;
    p.Xh = 0;
    u.Xh = 0;
    for (c = y.Xh = 0; c < a.of.length; c++) h = f = a.of[c],
    h.bg = d - h.jD >= h.Qd,
    h.bg ? g = !0 : (qw(f) && (a.Kd = !0), h = f.X, 5 === h ? Hw(s, f.Ok) : 6 === h && p ? Hw(p, f.Ok) : 7 === h ? Hw(u, f.Ok) : 8 === h ? Hw(y, f.Ok) : 10 === h ? (a.Gn = !0, Hw(y, f.Ok)) : 11 === h ? (a.wg = !0, Hw(u, f.Ok)) : 12 === h ? (a.Vs = !0, Hw(p, f.Ok)) : 4 === h ? a.bi = !0 : 13 === h ? a.Kf = !0 : 14 === h && (a.Kf = !0));
    if (g) for (c = a.of.length - 1; 0 <= c; c--) a.of[c].bl() && a.of.splice(c, 1);
    b && l && !a.Kf && (n.Sa = m($h(n.Jb)), n.Yc = $h(n.Ke))
}
function zh(a) {
    if (0 < a.of.length) {
        var b, c;
        for (b = a.of.length - 1; 0 <= b; b--) c = a.of[b],
        13 === c.X && a.of.splice(b, 1)
    }
}
function Pw(a, b) {
    switch (b) {
    case 1:
    case 13:
    case 14:
    case 0:
        return a.Kd;
    case 4:
        return a.bi;
    case 10:
        return a.Gn;
    case 12:
        return a.Vs
    }
    return ! 1
};
function Qw(a, b) {
    this.pa = b;
    this.hw = {};
    this.Z = a;
    this.Ey = this.fz = null;
    var c;
    for (c = 0; c < a.length; c++) this.hw[a[c]] = null
}
Qw.prototype.ef = function(a) {
    return this.hw[a]
};
Qw.prototype.So = function() {
    return this.fz
};
Qw.prototype.Qk = function(a) {
    this.hw[a.r] = a;
    a.Cw() && (this.Ey = a);
    1 === a.s && (this.fz = a)
};
function Rw(a, b) {
    this.ra = new Za;
    this.Gd = null;
    this.lj = new Za;
    this.Tl = new Za;
    this.Wc = new Za;
    this.Jw = b;
    this.MC = a;
    this.u = new Za;
    this.Db = new Za;
    this.w = this.cd = null;
    this.Ul = new Za;
    this.Sn = this.Rn = 0;
    this.Qb = new Za;
    this.Ug = null;
    this.dd = !1;
    this.ed = this.Cc = this.Bc = null;
    this.fg = -1;
    this.Hh = this.aB = this.qj = null
}
function Rd(a) {
    a.dd = !0;
    a.Bc = null;
    a.Cc = null;
    a.ed = null;
    a.Ug = null;
    a.fg = -1
}
function Sw(a, b, c, d) {
    a.Gd || (a.Gd = new Za);
    a.u === c ? (ab(a.Gd, a.u), tb(a.Gd, b), Mb(a.Gd), Nb(a.Gd, d)) : (ab(a.Gd, a.u), tb(a.Gd, c), b = Lb(a.Gd), 0 !== b && (Mb(a.Gd), Nb(a.Gd, d * (1 - b / d))))
}
e = Rw.prototype;
e.dc = function() {
    return this.Db.T
};
e.ec = function() {
    return this.Db.U
};
e.Ob = function() {
    return this.u.T
};
e.Pb = function() {
    return this.u.U
};
function Xt(a, b, c) {
    a.Rn = b;
    a.Sn = c;
    t(a.Ul, w.S.dc(b), w.S.ec(c))
}
e.et = function(a) {
    this.Bc = a
};
e.rB = function(a) {
    this.ed = a
};
function Tw(a, b) {
    var c = a.bc(),
    d = a.cc(),
    f,
    g,
    h = 1E9,
    l = null,
    n,
    p;
    for (n = -1; 1 >= n; n++) for (p = -1; 1 >= p; p++)(0 !== n || 0 !== p) && (f = w.S.hb(c + n, d + p)) && f !== b && (g = f.ln, !l || h > g) && (l = f, h = g);
    l || console.log("failed to find cheapest neighbor");
    return l
}
function Uw(a) {
    t(a.lj, 0, 0);
    var b, c, d = !1,
    f = xh(),
    g = w.Ni.eh,
    h;
    for (c = 0; c < w.i.D.length; c++) {
        b = w.i.D[c];
        b = b.p;
        if (b === a) break;
        h = a.u.ac(b.u);
        40 > h && (0 === h ? t(a.Wc, Math.random(), Math.random()) : ($a(a.Wc, a.u), tb(a.Wc, b.u)), Mb(a.Wc), ib(a.lj, a.Wc), d = !0)
    }
    for (c = 0; c < g.length; c++) b = g[c],
    b = b.p,
    b !== a && (h = a.u.ac(b.u), 50 > h && (0 === h ? t(a.Wc, Math.random(), Math.random()) : ($a(a.Wc, a.u), tb(a.Wc, b.u)), Mb(a.Wc), ib(a.lj, a.Wc), d = !0));
    for (c = 0; c < f.length; c++) b = f[c],
    b = b.p,
    b !== a && (h = a.u.ac(b.u), 50 > h && (0 === h ? t(a.Wc, Math.random(), Math.random()) : ($a(a.Wc, a.u), tb(a.Wc, b.u)), Mb(a.Wc), ib(a.lj, a.Wc), d = !0));
    d && (Mb(a.lj), Nb(a.lj, 0.5));
    return d
}
function Vw(a) {
    t(a.Tl, 0, 0);
    var b, c, d = !1,
    f = Qd(),
    g;
    for (c = 0; c < f.length; c++) b = f[c],
    b = b.p,
    b !== a && (g = a.Db.ac(b.Db), 40 > g && (0 === g ? t(a.Wc, Math.random(), Math.random()) : ($a(a.Wc, a.Db), tb(a.Wc, b.Db)), Mb(a.Wc), ib(a.Tl, a.Wc), d = !0));
    d && Mb(a.Tl);
    return d
};
function Uh(a, b, c, d, f) {
    this.Xt = a;
    this.zb = b;
    this.Kc = d;
    this.pa = c;
    if ((a = d.tb) && 0 !== a.length) {
        c = [];
        var g;
        for (g = 0; g < a.length; g++) c.push(a[g].r);
        a = c
    } else a = null;
    this.Z = a;
    if (d = d.tb) {
        a = {};
        for (c = 0; c < d.length; c++) a[d[c].r] = d[c].s;
        d = a
    } else d = null;
    this.KD = d;
    this.Yg = b != Vh ? new Qw(this.Z, this.pa) : null;
    this.Sb = this.ee = null;
    this.p = new Rw(Ww, Xw);
    this.Ja = new Nw(this);
    if (this.Ld = f) this.Ld.Bw = this;
    this.Y = Sd;
    this.Va = !1;
    this.ld = this.Ue = this.bj = this.hk = this.Zh = this.rh = this.Da = this.Fh = null;
    this.K = new Iw(this);
    this.au = -3 * Mw(this.K, !0);
    this.xg = null;
    this.QB = this.RB = 0;
    this.En = this.yg = null;
    this.gk = this.zb === bt ? [] : null;
    this.Ci = this.de = 0;
    this.Zi = !1;
    this.hi = this.gi = this.fi = this.ei = null;
    this.zb === bt && (b = this.Kc.Qg(), f = this.Kc.Rg(), d = this.Kc.Sg(), a = this.Kc.Tg(), Yw(this, b), Yw(this, f), Yw(this, d), Yw(this, a), this.ei = new is([b], !1), this.fi = new is([f], !1), this.gi = new is([d], !1), this.hi = new is([a], !1))
}
function Yw(a, b) {
    if (b) {
        var c, d;
        for (c = 0; c < b.length; c++) d = b[c],
        d.og(),
        d.sx(a),
        0 < c && (d.Wp = b[c - 1])
    }
}
function ki(a, b) {
    a.gk || (a.gk = []);
    vq(b);
    a.gk.push(b);
    a.Fh && a.Fh.Oa(b)
}
function Zw(a) {
    if (a) {
        var b;
        for (b = 0; b < a.length; b++) if (!a[b].He()) return ! 0
    }
    return ! 1
}
function ws(a) {
    return Zw(a.ei.Ha) || Zw(a.fi.Ha) || Zw(a.gi.Ha) || Zw(a.hi.Ha)
}
function Hu(a) {
    return a.yg && 0 !== a.yg.length ? a.En ? Math.max(0, a.yg.length - 1) : a.yg.length: 0
}
function Vt(a) {
    a.au = w.i.$a
}
function Ut(a) {
    return w.i.$a - a.au >= Mw(a.K, $t(a))
}
function $t(a) {
    return a.zb === bt || 1 === a.zb || 5 === a.zb
}
function ri(a) {
    return a.zb === Vh || 3 === a.zb || 4 === a.zb
}
e = Uh.prototype;
e.ef = function(a) {
    return this.Yg ? this.Yg.ef(a) : null
};
e.So = function() {
    return this.Yg ? this.Yg.So() : null
};
e.Qk = function(a) {
    $w(this, a);
    this.zb === bt && Kd(21)
};
function $w(a, b) {
    if (b.pa !== a.pa) console.log("failed to equip non-equipable item. itemSlot=" + b.r + " charClass=" + a.pa);
    else if (a.Yg) {
        var c = a.Yg.ef(b.r);
        a.Yg.Qk(b);
        a.Ld && (a.Ld.removeItem(b), c && bw(a.Ld, c));
        var c = a.K,
        d, f;
        c.xe.va = 0;
        c.Ae.va = 0;
        c.je.va = 0;
        c.sd.va = 0;
        c.Jb.va = 0;
        c.Ke.va = 0;
        var g = c.no.Z,
        h = c.no.Yg;
        for (d = 0; d < g.length; d++) if (f = h.ef(g[d])) {
            var l = c.sd;
            l.va += 1 === f.s ? f.va: 0;
            l = c.je;
            l.va += 2 === f.s ? f.va: 0;
            l = c.xe;
            l.va += 3 === f.s ? f.va: 0;
            l = c.Ae;
            l.va += 4 === f.s ? f.va: 0;
            l = c.Jb;
            l.va += 5 === f.s ? f.va: 0;
            l = c.Ke;
            l.va += 6 === f.s ? f.va: 0
        }
        c.Sa = Math.min(c.Sa, $h(c.Jb));
        c.Yc = Math.min(c.Yc, $h(c.Ke))
    }
}
e.gq = function(a) {
    this.Sb = a
};
e.v = function() {
    return this.ee
};
e.Cb = function(a) {
    this.Da = a
};
e.hq = function(a) {
    this.Ue = a
};
e.dr = function() {
    this.Fh && !this.Va && this.Fh.dr(this)
};
function Lq(a, b) {
    if (!a.Va && a.Y !== Sd) if (1 === a.Y) if (w.wb) {
        var c = a.p;
        if (a === w.i.gg) a: {
            ab(c.ra, c.Ul);
            tb(c.ra, c.Db);
            var d = b * c.MC * Ss.t * $q.t,
            f = w.S.bc(c.Db.T),
            g = w.S.cc(c.Db.U);
            if (Lb(c.ra) <= d) ab(c.Db, c.Ul),
            c.dd = !0;
            else if (f === c.Rn && g === c.Sn) c.dd = !0;
            else {
                if (!c.Hh || !c.qj || c.qj.bc() !== f || c.qj.cc() !== g) {
                    c.aB = c.qj;
                    c.qj = w.S.hb(f, g);
                    if (!c.qj) {
                        console.log("no current world tile!");
                        break a
                    }
                    1 >= Math.abs(f - c.Rn) && 1 >= Math.abs(g - c.Sn) ? c.Hh = w.S.hb(c.Rn, c.Sn) : (c.Hh = Tw(c.qj, c.aB), c.Hh && c.Hh.bc() !== c.Rn && c.Hh.cc() !== c.Sn && (c.Hh = Tw(c.Hh, c.qj)))
                }
                t(c.ra, c.Hh.dc() + 1, c.Hh.ec() + 1);
                tb(c.ra, c.Db);
                Vw(c) && (Mb(c.ra), Nb(c.Tl, 0.5), ib(c.ra, c.Tl));
                Mb(c.ra);
                Nb(c.ra, d);
                ib(c.Db, c.ra)
            }
        } else {
            ab(c.ra, c.Ul);
            tb(c.ra, c.Db);
            var h = b * c.MC * Ss.t * $q.t,
            l = w.S.bc(c.Db.T),
            n = w.S.cc(c.Db.U);
            Lb(c.ra) <= h ? (ab(c.Db, c.Ul), c.dd = !0) : l === c.Rn && n === c.Sn ? c.dd = !0 : (t(c.ra, c.Ul.T + 1, c.Ul.U + 1), tb(c.ra, c.Db), Vw(c) && (Mb(c.ra), Nb(c.Tl, 0.5), ib(c.ra, c.Tl)), Mb(c.ra), Nb(c.ra, h), ib(c.Db, c.ra))
        }
    } else {
        var p = a.p,
        s;
        s = $t(a) ? b * p.Jw * Ss.t * $q.t: p.Jw * b;
        if (null != p.Ug && 0 < p.Ug.length) {
            var u = p.Ug[0];
            t(p.ra, u.me, u.ne);
            tb(p.ra, p.u);
            if (Lb(p.ra) <= s) {
                var y;
                if (! (y = u.Mb)) {
                    var A;
                    a: {
                        var C, v = Qd(),
                        D = v[0].p,
                        N = D.w,
                        I = D.cd;
                        for (C = 1; C < v.length; C++) if (D = v[C].p, D.cd != I || D.w != N) {
                            A = !1;
                            break a
                        }
                        A = !0
                    }
                    var x;
                    if (x = A) a: {
                        var z, O = Qd(),
                        J,
                        la = u.Yk.Km;
                        for (z = 0; z < O.length; z++) {
                            if (O[z].Ja.Kd) {
                                x = !1;
                                break a
                            }
                            if (la && (J = O[z].K, O[z].zb === bt && (J.Sa / $h(J.Jb) < ax || J.Yc / $h(J.Ke) < bx))) {
                                x = !1;
                                break a
                            }
                        }
                        x = !0
                    }
                    y = x
                }
                if (y) {
                    t(p.u, u.me | 0, u.ne | 0);
                    var Q = p.Ug.shift();
                    if (!Q.Mb) a: {
                        var V = w.i.da;
                        if (!Q.Mb) {
                            Q.Mb = !0;
                            w.i.aa.Ur();
                            Kd(2);
                            Q.$d.Xi || (mh(Q.$d), Ag(Q.$d), nh(Q.$d));
                            var na = Q.Yk;
                            if (!na.Km) {
                                Mg(na, !0);
                                var K = Lg(na, Q);
                                if (!K.Mb) {
                                    V.et(K);
                                    V.Cc = K.$d;
                                    break a
                                }
                            }
                            Q === V.Bc && (V.Cc = V.Bc.$d, V.Bc = null)
                        }
                    }
                    p.w ? (p.cd = Q.Yk, p.w = null) : (p.cd = null, p.w = Q.$d);
                    p.fg = -1;
                    0 === p.Ug.length && (p.ed || Rd(p))
                }
            } else if (p.cd) {
                var H = p.cd.Sk,
                S = u === p.cd.Be; - 1 === p.fg && (p.fg = S ? 0 : H.length - 1);
                var da = null,
                W;
                S ? p.fg < H.length - 1 && (W = H[p.fg + 1], da = w.Ba.hb(W.T, W.U)) : 0 < p.fg && (W = H[p.fg - 1], da = w.Ba.hb(W.T, W.U));
                da ? t(p.ra, da.Ob(), da.Pb()) : t(p.ra, u.me, u.ne);
                tb(p.ra, p.u);
                Lb(p.ra) <= s ? (da ? t(p.u, da.Ob() | 0, da.Pb() | 0) : t(p.u, u.me | 0, u.ne | 0), S ? p.fg++:p.fg--) : (Mb(p.ra), Nb(p.ra, s), ib(p.u, p.ra))
            } else Uw(p) && (Mb(p.ra), ib(p.ra, p.lj)),
            Mb(p.ra),
            Nb(p.ra, s),
            ib(p.u, p.ra)
        } else ab(p.ra, p.Qb),
        tb(p.ra, p.u),
        Lb(p.ra) <= s ? (ab(p.u, p.Qb), p.ed && w.i.da.iw(), Rd(p)) : (Uw(p) && (Mb(p.ra), ib(p.ra, p.lj)), Mb(p.ra), Nb(p.ra, s), ib(p.u, p.ra));
        if (p.w) if ($t(a)) {
            if (p.w) {
                var ia = p.w,
                ea = p.u,
                va = w.Nh;
                ea && (Gg(ia, ea) || ia.Za && Jb(ea, ia.Za.tq, ia.Za.uq) < w.B || Fg(ia, ea, va))
            }
        } else p.w && Fg(p.w, p.u, w.Nh)
    } else {
        if (2 === a.Y) {
            if (a.Da && !a.Da.Va) {
                if (0 < a.K.Oj) xw(a, !1);
                else {
                    var yb = a.Da;
                    yb && yw(a, yb, !1)
                }
                $t(a) && w.i.aa.as()
            }
        } else if (a.Y === Kq) {
            if (a.Da && !a.Da.Va) {
                if (0 < a.K.Oj) xw(a, !0);
                else {
                    var Fb = a.Da;
                    Fb && yw(a, Fb, !0)
                }
                $t(a) && w.i.aa.ds()
            }
        } else if (a.Y === Jq) {
            if (a.ld) {
                var pa = a.ld.ga,
                T = a.ld.X;
                if (2 !== pa || 4 !== T && 1 !== T && 0 !== T) if (3 === pa) {
                    var X = a.ld;
                    if (X) {
                        var Ca, qa, ta, eb, Gb, Da = X.ya,
                        ub = X.ca,
                        mb = a.p.u,
                        Ea = si(a);
                        for (Ca = 0; Ca < Ea.length; Ca++) {
                            qa = Ea[Ca];
                            ta = new fw;
                            ta.Ca = a;
                            ta.Cb(qa);
                            ta.Ib = X;
                            ta.yd = !0;
                            eb = qa.p.u;
                            Da && (Gb = new Zb(Da, mb, eb, !0, 1), Gb.ud = a, ta.Xb = Gb);
                            if (ub) {
                                var La = new Zb(ub, mb, eb, !1, 1);
                                ta.xb = La
                            }
                            mw(w.Xe, ta)
                        }
                        var wa = a.K,
                        Fa = bu(wa);
                        Cw(wa, Fa)
                    }
                } else if (5 === pa) {
                    var ha = a.ld;
                    if (ha) {
                        var ja = a.Da;
                        if (ja && !ja.Va) {
                            var Ga = 1 + (a.K.ar + 1),
                            bb = null,
                            za = null,
                            nb = null,
                            fb = null,
                            cb = null,
                            Ua,
                            Va,
                            mc,
                            vb = ha.ca,
                            Sb,
                            Ma,
                            zb = a.p.u;
                            for (Ua = 0; Ua < Ga && ja; Ua++) {
                                Va = new fw;
                                Va.Ca = a;
                                Va.Cb(ja);
                                Va.Ib = ha;
                                Va.yd = !0;
                                mc = ja.p.u;
                                Sb = new Zb(null, zb, mc, !0, 2);
                                Sb.ud = a;
                                Va.Xb = Sb;
                                var Hb = new Zb(vb, mc, mc, !1, 1);
                                Va.xb = Hb;
                                zb = mc;
                                Ma = Math.max(1, zw(a, ja));
                                Va.Rd = 0 === Ma;
                                Va.Jc = Ma;
                                mw(w.Xe, Va);
                                var ac = G,
                                ob = si(ja);
                                if (0 === ob.length) bb = null;
                                else {
                                    var pb = ja.p.w;
                                    if (pb) {
                                        for (var Ha = void 0,
                                        jb = void 0,
                                        Ab = ja.p.u,
                                        Bb = null,
                                        qb = null,
                                        wb = void 0,
                                        Ib = void 0,
                                        Ec = -1,
                                        jb = 0; jb < ob.length; jb++) Ha = ob[jb],
                                        Ha === ja || Ha === za || Ha === nb || Ha === fb || Ha === cb || Ha.Va || Ha.p.w !== pb || (wb = Ab.ac(Ha.p.u), wb <= ac && (0 > Ec || wb < Ec) && (Ib = Ha.Ja, Ib.wg || Ib.Kd || Ib.bi ? qb = Ha: (Bb = Ha, Ec = wb)));
                                        bb = Bb ? Bb: qb
                                    } else bb = null
                                }
                                cb = fb;
                                fb = nb;
                                nb = za;
                                za = ja;
                                ja = bb
                            }
                            var bc = a.K,
                            Wa = bu(bc);
                            Cw(bc, Wa)
                        }
                    }
                } else if (6 === pa) {
                    var cc = a.ld;
                    if (cc) {
                        var Qa = a.Da;
                        if (Qa && !Qa.Va) {
                            var nc = a.K.Qq + 1,
                            sa, Tb, qc = cc.ya,
                            Fc = cc.ca,
                            Cb = a.p.u,
                            kb = a.p.w,
                            Ra = Qa.p.u,
                            Ja, Db;
                            if (kb) if (Fc) {
                                sa = new fw;
                                sa.Ca = a;
                                sa.Cb(Qa);
                                sa.Ib = cc;
                                sa.yd = !0;
                                qc && (Tb = new Zb(qc, Cb, Ra, !0, 1), Tb.ud = a, sa.Xb = Tb);
                                Ja = $h(a.K.sd);
                                sa.Rd = !1;
                                sa.Jc = Ja;
                                Db = new Zb(Fc, Cb, Ra, !1, Yb);
                                Db.ud = a;
                                Db.ew = kb;
                                Db.li = Ja;
                                sa.xb = Db;
                                var gb = Qa.p,
                                rb = gb.w,
                                dc = w.Ba.Ai(gb.Ob()),
                                Ka = w.Ba.Bi(gb.Pb()),
                                Xa,
                                hb = rb.ia,
                                lb = rb.ja,
                                rc = hb + rb.rb,
                                sc = lb + rb.qb,
                                Aa,
                                db,
                                Mc = Math.max(hb, dc - nc),
                                ec = Math.min(rc, dc + nc),
                                Ub = Math.max(lb, Ka - nc),
                                sb = Math.min(sc, Ka + nc);
                                for (Aa = Mc; Aa <= ec; Aa++) for (db = Ub; db <= sb; db++)(Xa = w.Ba.hb(Aa, db)) && 0.5 > Math.random() && sg(Xa, Db);
                                mw(w.Xe, sa);
                                var ka = a.K,
                                Eb = bu(ka);
                                Cw(ka, Eb)
                            } else console.log("no effect name for rain damage spell")
                        }
                    }
                } else if (8 === pa) {
                    var xb = a.Da;
                    if (xb && !xb.Va) {
                        var Na = a.ld;
                        if (Na) {
                            var Ya = new fw;
                            Ya.Ca = a;
                            Ya.Cb(xb);
                            var tc = xb.p.u,
                            me = a.p.u;
                            Ya.Ib = Na;
                            Ya.yd = !0;
                            var ne = Na.ya;
                            if (ne) {
                                var Le = new Zb(ne, me, tc, !0, 1);
                                Le.ud = a;
                                Ya.Xb = Le
                            }
                            var Td = Na.ca;
                            if (Td) {
                                var oe = $h(a.K.sd);
                                Ya.Rd = !1;
                                Ya.Jc = oe;
                                var Y = new Zb(Td, me, tc, !1, Yb),
                                nf = xb.p.w;
                                Y.ud = a;
                                Y.ew = nf;
                                Y.li = oe;
                                Ya.xb = Y;
                                var Nc = a.K.ho + 1,
                                gd = xb.p,
                                uc = gd.w,
                                U = w.Ba.Ai(gd.Ob()),
                                Z = w.Ba.Bi(gd.Pb()),
                                $ = uc.ia,
                                ba = uc.ja,
                                ca = $ + uc.rb,
                                q = ba + uc.qb;
                                Ew(U, Z, $, ca, ba, q, Y);
                                0 < Nc && (Ew(U, Z - 1, $, ca, ba, q, Y), Ew(U, Z + 1, $, ca, ba, q, Y), Ew(U - 1, Z, $, ca, ba, q, Y), Ew(U + 1, Z, $, ca, ba, q, Y), Ew(U - 1, Z - 1, $, ca, ba, q, Y), Ew(U - 1, Z + 1, $, ca, ba, q, Y), Ew(U + 1, Z - 1, $, ca, ba, q, Y), Ew(U + 1, Z + 1, $, ca, ba, q, Y), 1 < Nc && (Ew(U, Z - 2, $, ca, ba, q, Y), Ew(U, Z + 2, $, ca, ba, q, Y), Ew(U - 2, Z, $, ca, ba, q, Y), Ew(U + 2, Z, $, ca, ba, q, Y), Ew(U - 2, Z - 1, $, ca, ba, q, Y), Ew(U - 2, Z + 1, $, ca, ba, q, Y), Ew(U + 2, Z - 1, $, ca, ba, q, Y), Ew(U + 2, Z + 1, $, ca, ba, q, Y), Ew(U - 1, Z - 2, $, ca, ba, q, Y), Ew(U - 1, Z + 2, $, ca, ba, q, Y), Ew(U + 1, Z - 2, $, ca, ba, q, Y), Ew(U + 1, Z + 2, $, ca, ba, q, Y), 2 < Nc && (Ew(U - 2, Z - 2, $, ca, ba, q, Y), Ew(U - 2, Z + 2, $, ca, ba, q, Y), Ew(U + 2, Z - 2, $, ca, ba, q, Y), Ew(U + 2, Z + 2, $, ca, ba, q, Y), Ew(U - 3, Z - 1, $, ca, ba, q, Y), Ew(U - 3, Z, $, ca, ba, q, Y), Ew(U - 3, Z + 1, $, ca, ba, q, Y), Ew(U + 3, Z - 1, $, ca, ba, q, Y), Ew(U + 3, Z, $, ca, ba, q, Y), Ew(U + 3, Z + 1, $, ca, ba, q, Y), Ew(U - 1, Z - 3, $, ca, ba, q, Y), Ew(U, Z - 3, $, ca, ba, q, Y), Ew(U + 1, Z - 3, $, ca, ba, q, Y), Ew(U - 1, Z + 3, $, ca, ba, q, Y), Ew(U, Z + 3, $, ca, ba, q, Y), Ew(U + 1, Z + 3, $, ca, ba, q, Y))));
                                var pe = a.K,
                                fc = bu(pe);
                                Cw(pe, fc);
                                mw(w.Xe, Ya)
                            } else console.log("error: blast spell has no effect name!")
                        }
                    }
                } else if (10 === pa || 17 === pa) {
                    if (a.ld) {
                        var vd = a.K,
                        qe = vd.gl,
                        gc = Hu(a),
                        vc = Math.max(0, qe - gc);
                        if (! (1 > vc)) {
                            var $c;
                            for ($c = 0; $c < vc; $c++) {
                                var Gc = a,
                                ad = Gc.ld,
                                Vb = new fw;
                                Vb.Ca = Gc;
                                Vb.Cb(Gc);
                                Vb.Rd = !1;
                                Vb.Jc = 0;
                                Vb.Ib = ad;
                                Vb.yd = !1;
                                var Tc = Gc.p.u,
                                hd = Dw(Tc, Gc.p.w),
                                id = ad.ya;
                                if (id) {
                                    var jd = new Zb(id, Tc, hd, !0, 1);
                                    jd.ud = Gc;
                                    Vb.Xb = jd
                                }
                                var kd = ad.ca;
                                if (kd) {
                                    var eg = new Zb(kd, Tc, hd, !1, 1);
                                    Vb.xb = eg;
                                    mw(w.Xe, Vb)
                                } else console.log("error: summon spell has no effect name!")
                            }
                            Cw(vd, bu(vd))
                        }
                    }
                } else if (11 === pa) {
                    if (a.ld) {
                        var hc = a.K,
                        re = hc.gl,
                        of = Hu(a),
                        wd = w.Gf.Og,
                        rl = Math.max(0, re - of),
                        cj = Math.min(rl, wd.length),
                        Ah = 0,
                        dj = a.p.w,
                        Bh;
                        if (! (0 >= cj)) {
                            var Me;
                            for (Me = 0; Me < wd.length && Ah < cj; Me++) if (Bh = wd[Me], Bh.p.w === dj) {
                                var Ne = a,
                                Oe = Bh,
                                fg = Ne.ld,
                                ld = new fw;
                                ld.Ca = Ne;
                                ld.Cb(Oe);
                                ld.Rd = !1;
                                ld.Jc = 0;
                                ld.Ib = fg;
                                ld.yd = !0;
                                var pf = Ne.p.u,
                                qf = Oe.p.u,
                                rf = fg.ya;
                                if (rf) {
                                    var sf = new Zb(rf, pf, qf, !0, 1);
                                    sf.ud = Ne;
                                    ld.Xb = sf
                                }
                                var Ch = fg.ca;
                                if (Ch) {
                                    var gg = new Zb(Ch, pf, qf, !1, 1);
                                    ld.xb = gg;
                                    mw(w.Xe, ld)
                                } else console.log("error: summon spell has no effect name!");
                                Ah++
                            }
                            Cw(hc, bu(hc))
                        }
                    }
                } else if (9 === pa) {
                    var se = a.ld;
                    if (se) {
                        var Md = new fw;
                        Md.Ca = a;
                        Md.Cb(a);
                        Md.Rd = !1;
                        Md.Jc = 0;
                        Md.Ib = se;
                        Md.yd = !1;
                        var tf = a.p.u,
                        uf = Dw(tf, a.p.w),
                        Dh = se.ya;
                        if (Dh) {
                            var ej = new Zb(Dh, tf, uf, !0, 1);
                            ej.ud = a;
                            Md.Xb = ej
                        }
                        var hg = se.ca;
                        if (hg) {
                            var ig = new Zb(hg, tf, uf, !1, 1);
                            Md.xb = ig;
                            var Eh = a.K,
                            Sa = bu(Eh);
                            Cw(Eh, Sa);
                            mw(w.Xe, Md)
                        } else console.log("error: summon spell has no effect name!")
                    }
                } else if (12 === pa) {
                    var bd = Bw(a);
                    if (bd) {
                        bd.ut = !0;
                        bd.Df = a.K.vt + 1;
                        var Fh = a.p.u;
                        Fh ? (bd.pl || (bd.pl = new Za), ab(bd.pl, Fh)) : bd.pl = null;
                        var Gh = Fw(a, bd.Da);
                        bd.Jc = Gh;
                        bd.Rd = 0 === Gh;
                        var Hh = bd.Xb;
                        Hh && (Hh.Gs = !0)
                    }
                } else if (13 === pa) {
                    var Ih = Bw(a);
                    if (Ih) {
                        var fj = a.K.nt + 1;
                        0 < fj && (Ih.Xs = !0, Ih.Df = fj)
                    }
                } else Bw(a);
                else a: {
                    var vf = a.ld;
                    if (vf) {
                        var wf = a.Da;
                        if (!wf || wf.Va) if (wf = Iq(a), !wf) break a;
                        var Jh, te = vf.X;
                        if (1 === te || 0 === te) Jh = a.K.mr + 1;
                        else if (4 === te) Jh = a.K.Ft + 1;
                        else {
                            console.log("wrong effect type: " + te);
                            break a
                        }
                        var Ud;
                        var xf = wf,
                        yf = Jh,
                        xd;
                        var sl = G,
                        Kh = qi(a);
                        if (0 === Kh.length) xd = null;
                        else {
                            var jg = xf.p.w;
                            if (jg) {
                                var Vd, Nd, tl = xf.p.u,
                                kg, ue = [];
                                for (Vd = 0; Vd < Kh.length && (Nd = Kh[Vd], Nd.Va || Nd.p.w !== jg || Pw(Nd.Ja, te) || (Nd === xf ? ue.push(Nd) : (kg = tl.ac(Nd.p.u), kg <= sl && ue.push(Nd)), !(1E3 <= ue.length))); Vd++);
                                xd = ue
                            } else xd = null
                        }
                        if (xd) if (xd.length < yf) Ud = xd;
                        else {
                            var Uc = [],
                            ve,
                            zf = 0;
                            for (Uc.push(xf); Uc.length < yf && 10 > zf;) ve = xd[k(Uc.length)],
                            0 > Uc.indexOf(ve) ? Uc.push(ve) : zf++;
                            if (Uc.length < yf) {
                                var we;
                                for (we = 0; we < xd.length && !(ve = xd[we], 0 > Uc.indexOf(ve) && (Uc.push(ve), Uc.length >= yf)); we++);
                            }
                            Ud = Uc
                        } else Ud = null;
                        if (Ud && 0 !== Ud.length) {
                            var xe, Wd, yd, lg, mg, Af = vf.ya,
                            ng = vf.ca,
                            Lh = a.p.u;
                            for (xe = 0; xe < Ud.length; xe++) if (Wd = Ud[xe], 4 !== Wd.zb || 1 !== te && 0 !== te) {
                                yd = new fw;
                                yd.Ca = a;
                                yd.Cb(Wd);
                                yd.Ib = vf;
                                yd.yd = !0;
                                lg = Wd.p.u;
                                Af && (mg = new Zb(Af, Lh, lg, !0, 1), mg.ud = a, yd.Xb = mg);
                                if (ng) {
                                    var ul = new Zb(ng, Lh, lg, !1, 1);
                                    yd.xb = ul
                                }
                                mw(w.Xe, yd)
                            } else sh(w.pc, Wd, "免疫!", "white");
                            var Bf = a.K,
                            Mh = bu(Bf);
                            Cw(Bf, Mh)
                        }
                    }
                }
                $t(a) && w.i.aa.gs()
            }
        } else if (5 === a.Y) {
            if (a.rh && !a.rh.gc) {
                var Pe = a.rh.Xl,
                gj = w.pc;
                0 < Pe && sh(gj, a, Pe + "黄金", "yellow");
                at(a.rh.Xl);
                w.i.aa.dp(a.rh.Xl);
                a.rh.oh(!0);
                Fi(a.rh);
                a.rh = null;
                Kd(9)
            }
        } else if (7 === a.Y) a.Zh && !a.Zh.gc && (sh(w.pc, a, "卷轴!", "white"), Cq(a.Zh.vf()), a.Zh.oh(!0), Oq(a.Zh), a.Zh = null, Kd(10));
        else if (8 === a.Y) a.hk && !a.hk.gc && (sh(w.pc, a, "药剂!", "white"), a.hk.oh(!0), or(a.hk), rr(a.hk.hc), a.Zh = null, Kd(11));
        else if (6 === a.Y) {
            if (a.bj && !a.bj.gc) {
                a.bj.oh(!0);
                Yv(a.bj);
                var Qe = a.bj.getItem(),
                Cf = Qe.uf();
                bw(Qe.nj.Ld, Qe);
                w.i.aa.ep(Qe);
                Kd(12);
                if (0 != Cf) switch (Cf) {
                case 1:
                    Kd(13);
                    break;
                case 2:
                    Kd(14);
                    break;
                case 3:
                    Kd(15);
                    break;
                case 4:
                    Kd(16)
                }
                a.bj = null
            }
        } else if (12 === a.Y) {
            if (a.Ue && !a.Ue.Kg) {
                var Xd = a.Ue,
                Oc, Yd = Xd.Nn,
                Re = ug(Yd) + w.B,
                Zd = vg(Yd) - w.B,
                Vc = wg(Yd) + w.B,
                Od = xg(Yd) - w.B,
                wc = Xd.zq,
                zd = Xd.Aq,
                Ad = Xd.Mf;
                wc < Re ? wc = Re: wc > Zd && (wc = Zd);
                zd < Vc ? zd = Vc: zd > Od && (zd = Od);
                Hi(Xd, !0);
                if (1 === Ad) {
                    var Nh = 10 + k(10),
                    hj;
                    for (Oc = 0; Oc < Nh; Oc++) {
                        hj = 1 + Dg();
                        var vl = new Eg(hj, vw(wc, Re, Zd), vw(zd, Vc, Od), Yd);
                        w.ff.pe.push(vl)
                    }
                }
                if (1 === Ad || 2 === Ad) {
                    var og = 7 + k(8);
                    for (Oc = 0; Oc < og; Oc++) {
                        var ij = w.dh,
                        Df = vw(wc, Re, Zd),
                        Oh = vw(zd, Vc, Od),
                        wA = Yd,
                        Np,
                        Op = w.Sm,
                        wl = w.i.D[k(w.i.D.length)],
                        Pp = wl.Z,
                        xA = Pp[k(Pp.length)],
                        zA = (100 - Math.min(90, E.Yl.t + cx)) / 100,
                        AA = Op.uf(zA),
                        CA = (100 - Math.min(90, E.lp.t + dx)) / 100,
                        DA = Sv(wl.K.Eb, CA); (Np = Nv(Op, xA, wl, DA, AA)) && ij.yf.push(new zv(Np, Df, Oh, wA))
                    }
                }
                if (1 === Ad || 3 === Ad) {
                    var EA = 2 + k(5);
                    for (Oc = 0; Oc < EA; Oc++) {
                        var Qp = w.nh.Pl,
                        FA = Qp[k(Qp.length)],
                        GA = new Mq(FA, vw(wc, Re, Zd), vw(zd, Vc, Od), Yd);
                        w.Uh.kf.push(GA)
                    }
                }
                if (1 === Ad) {
                    var HA = 0 + k(2);
                    for (Oc = 0; Oc < HA && w.Yj.re.length < sr + tr.t; Oc++) {
                        var IA = new Tq(Sq[k(Sq.length)]),
                        JA = new mr(IA, vw(wc, Re, Zd), vw(zd, Vc, Od), Yd);
                        w.Ti.Hf.push(JA)
                    }
                }
                sh(w.pc, a, "搜索!!!", "#FFF");
                switch (Ad) {
                case 1:
                    w.i.aa.hs();
                    Kd(6);
                    break;
                case 2:
                    w.i.aa.js();
                    Kd(7);
                    break;
                case 3:
                    w.i.aa.Rr(),
                    Kd(8)
                }
                Ta("Treasure Chest", "Looted");
                a.Ue = null
            }
        } else if (9 === a.Y) {
            if (w.i.da.Wb) {
                var Ef = w.i.da;
                if (Ef.Wb && !Ef.Wb.oe) {
                    Ef.Cc = null;
                    Ef.Bc = null;
                    Ef.ed = null;
                    Ef.Ue = null;
                    var ye = Ef.Wb;
                    w.Mc = ye;
                    ye.ri = 0;
                    Jd(ye.er(), ye.Go, ye.Aj, !0);
                    w.wb = !1;
                    ye.qf ? Ta("Dungeon", "Entering Dungeon Again") : (ye.qf = !0, ye.Nk = Ia(w.Aa.Mk + 1, ex, 1), ee(ye), Ta("Dungeon", "Discovered Dungeon"))
                }
            }
        } else if (11 === a.Y) {
            if (w.i.da.ge) {
                var Se = w.i.da;
                if (Se.ge) if (Se.ge.cb) Se.ge = null;
                else {
                    Se.Cc = null;
                    Se.Bc = null;
                    Se.ed = null;
                    Se.Ue = null;
                    var xl = Se.ge;
                    w.le = xl;
                    Jd(xl.er(), 11, !1, !0);
                    w.wb = !1;
                    Ta("Castle", "正在进入城堡:" + xl.mi)
                }
            }
        } else if (10 === a.Y && w.i.da.Lf) {
            var Rp = w.i.da;
            if (Rp.Lf) {
                var jj;
                for (jj = 0; jj < w.i.D.length; jj++) {
                    var yl = w.i.D[jj],
                    Sp = yl.Ld,
                    zl = Sp.items;
                    if (0 !== zl.length) {
                        for (var Ph = void 0,
                        kj = void 0,
                        Tp = 0,
                        Up = void 0,
                        Al = 0,
                        LA = 0.1 + Ws.t,
                        Ph = zl.length - 1; 0 <= Ph; Ph--) kj = zl[Ph],
                        (Up = yl.ef(kj.r)) && !ss(kj, Up) && (Al += kj.zf * LA, Tp++, Kd(17), dw(Sp, Ph));
                        w.i.aa.Zr(Tp);
                        sh(w.pc, yl, "黄金!", "yellow");
                        var Vp = w.ug;
                        Vp.ni += m(Al)
                    }
                }
                Ta("Shop", "卖出所有道具");
                Rp.Lf = null
            }
        }
        a.Y = Sd
    }
};
function fx() {
    this.VC = 1E8
}
function gx(a, b, c) {
    a = a.VC;
    var d = w.S.q,
    f, g, h;
    for (h = 0; 3 > h; h++) for (f = d[h], g = 0; 3 > g; g++) for (var l = f[g], n = a, p = void 0, s = void 0, u = void 0, p = 0; p < l.jo.length; p++) for (u = l.jo[p], s = 0; s < u.length; s++) u[s].ln = n;
    if (c = w.S.hb(b, c)) for (b = [], c.ln = 0, b.push(c), c = [null, null, null, null]; 0 < b.length;) for (g = b.shift(), a = g.ln, d = c, f = g.bc(), g = g.cc(), d[0] = w.S.hb(f, g - 1), d[1] = w.S.hb(f - 1, g), d[2] = w.S.hb(f + 1, g), d[3] = w.S.hb(f, g + 1), g = 0; g < c.length; g++) {
        if (d = c[g]) f = a + d.Ln + 1,
        f < d.ln && (d.ln = f, b.push(d))
    } else console.log("error: destination is not on grid!!!")
};
function hx() {
    this.tk = this.Sl = this.Nl = this.nk = this.Zk = this.xl = this.Ol = this.Gi = this.Ph = this.kl = this.Xj = this.El = this.ul = this.Gl = this.wl = this.hl = this.oj = this.Sd = this.Ff = this.Dl = this.si = this.Wk = this.Xk = this.Rk = this.uk = this.wi = this.Mj = this.qn = this.Lk = this.On = 0
}
e = hx.prototype;
e.jx = function() {
    this.tk = this.Sl = this.Nl = this.nk = this.Zk = this.xl = this.Ol = this.Gi = this.Ph = this.kl = this.Xj = this.El = this.ul = this.Gl = this.wl = this.hl = this.oj = this.Sd = this.Ff = this.Dl = this.si = this.Wk = this.Xk = this.Rk = this.uk = this.wi = this.Mj = this.qn = this.Lk = this.On = 0
};
e.is = function() {
    this.On++
};
e.es = function() {
    this.qn++
};
e.Ur = function() {
    this.Lk++
};
e.$r = function() {
    this.Mj++
};
e.Vr = function() {
    this.wi++
};
e.Sr = function() {
    this.uk++
};
e.Xr = function() {
    this.Rk++
};
e.Yr = function(a) {
    this.Wk += a
};
e.dp = function(a) {
    this.Xk += a
};
e.Wr = function(a) {
    this.Sd += a
};
e.dt = function(a) {
    this.Sd = a
};
e.cp = function() {
    this.si++
};
e.gp = function() {
    this.Dl++
};
e.$k = function() {
    this.Ff++
};
e.wx = function(a) {
    this.Ff = a
};
e.bs = function() {
    this.kl++
};
e.Tr = function() {
    this.oj++
};
e.as = function() {
    this.hl++
};
e.ds = function() {
    this.wl++
};
e.gs = function() {
    this.Gl++
};
e.cs = function() {
    this.ul++
};
e.fs = function() {
    this.El++
};
e.fp = function(a) {
    this.Xj += a
};
e.Zr = function(a) {
    this.Ph += a
};
e.ep = function(a) {
    this.Gi++;
    switch (a.uf()) {
    case 1:
        this.Ol++;
        break;
    case 2:
        this.xl++;
        break;
    case 3:
        this.Zk++;
        break;
    case 4:
        this.nk++
    }
};
e.hs = function() {
    this.Nl++
};
e.js = function() {
    this.Sl++
};
e.Rr = function() {
    this.tk++
};
function ix() {}
ix.prototype = new hx;
ix.prototype.jx = function() {
    console.log("Reset invoked on total statistics. Not resetting anything.")
};
function bs(a, b) {
    var c = a.qo[b];
    return c ? c: 0
}
function cs(a, b) {
    var c = a.lq[b];
    return c ? c: 0
};
function jx() {
    this.Ua = this.aa = null
}
function kx() {
    var a = w.i.aa,
    b = w.i.Ua;
    a.aa = w.i.Ih;
    a.Ua = b
}
e = jx.prototype;
e.is = function() {
    this.aa.is();
    this.Ua.is()
};
e.Ur = function() {
    this.aa.Ur();
    this.Ua.Ur()
};
e.es = function() {
    this.aa.es();
    this.Ua.es()
};
e.$r = function() {
    this.aa.$r();
    this.Ua.$r()
};
e.Vr = function() {
    this.aa.Vr();
    this.Ua.Vr()
};
e.Sr = function() {
    this.aa.Sr();
    this.Ua.Sr()
};
e.Yr = function(a) {
    this.aa.Yr(a);
    this.Ua.Yr(a)
};
e.dp = function(a) {
    this.aa.dp(a);
    this.Ua.dp(a)
};
e.Wr = function(a) {
    this.aa.Wr(a);
    this.Ua.Wr(a)
};
e.cp = function() {
    this.aa.cp();
    this.Ua.cp()
};
e.gp = function() {
    this.aa.gp();
    this.Ua.gp()
};
e.$k = function() {
    this.aa.$k();
    this.Ua.$k()
};
e.bs = function() {
    this.aa.bs();
    this.Ua.bs()
};
e.Tr = function() {
    this.aa.Tr();
    this.Ua.Tr()
};
e.as = function() {
    this.aa.as();
    this.Ua.as()
};
e.ds = function() {
    this.aa.ds();
    this.Ua.ds()
};
e.gs = function() {
    this.aa.gs();
    this.Ua.gs()
};
e.cs = function() {
    this.aa.cs();
    this.Ua.cs()
};
e.fs = function() {
    this.aa.fs();
    this.Ua.fs()
};
e.Xr = function() {
    this.aa.Xr();
    this.Ua.Xr()
};
e.fp = function(a) {
    this.aa.fp(a);
    this.Ua.fp(a)
};
e.Zr = function(a) {
    this.aa.Zr(a);
    this.Ua.Zr(a)
};
e.ep = function(a) {
    this.aa.ep(a);
    this.Ua.ep(a)
};
e.hs = function() {
    this.aa.hs();
    this.Ua.hs()
};
e.js = function() {
    this.aa.js();
    this.Ua.js()
};
e.Rr = function() {
    this.aa.Rr();
    this.Ua.Rr()
};
function lx() {
    this.fd = this.cg = this.Je = 0;
    this.zs = this.xs = -1;
    this.ed = this.Bc = this.Cc = this.Ue = this.Wf = this.Lf = this.ge = this.Wb = null;
    this.Ks = !1;
    this.gn = null;
    this.Mp = !1;
    this.Ht = new fx;
    this.hp = !1;
    this.Om = this.Nm = 0
}
function au(a) {
    var b = w.i.da;
    mx(b, a);
    b.Ks = !0
}
function mx(a, b) {
    a.gn = b;
    a.gn && (a.Cc = a.gn, a.ed = null, a.Bc = null)
}
function vu(a) {
    return a.Mp || a.Ks
}
function Is(a) {
    var b = w.i.da;
    b.Je += a
}
function ps(a, b) {
    a.Je -= b;
    0 > a.Je && (a.Je = 0)
}
function uw(a) {
    var b = w.i.da;
    b.cg += a
}
function at(a) {
    var b = w.i.da;
    b.fd += a
}
function Ks(a) {
    var b = w.i.da;
    b.fd -= a;
    0 > b.fd && (b.fd = 0)
}
function ci(a) {
    0 > a.xs && (a.xs = nx());
    return a.xs
}
function vs() {
    var a = w.i.da;
    0 > a.zs && (a.zs = ox(a));
    return a.zs
}
function xs() {
    var a = w.i.da;
    a.xs = nx();
    a.zs = ox(a)
}
function nx() {
    var a = -1,
    b, c;
    for (c = 0; c < w.i.D.length; c++) b = w.i.D[c].K.Eb,
    a < b && (a = b);
    return a
}
function ox(a) {
    a = ci(a);
    var b, c;
    for (c = 0; c < w.i.D.length; c++) b = w.i.D[c].K.Eb,
    a > b && (a = b);
    return a
}
e = lx.prototype;
e.hq = function(a) {
    this.Ue = a
};
e.iw = function() {
    this.Ue = this.ed = this.Bc = this.Cc = null;
    if (w.Mc) w.Mc.iw();
    else if (w.le) {
        var a = w.le;
        w.le = null;
        w.wb = !0;
        var b, c = Qd(),
        d,
        f;
        for (f = 0; f < c.length; f++) d = c[f],
        b = d.p,
        Rd(b),
        b.cd = null,
        b.w = null,
        d.Y = Sd;
        $d();
        a.ye = !1;
        Lc();
        a.cb = !0;
        b = [];
        var g;
        for (d = 0; d < a.ck.length; d++) f = a.ck[d],
        c = f.Hd,
        f = f.Id,
        (g = dd(c - 1 + "_" + f)) && g !== a && g.$b && 0 > b.indexOf(g) && b.push(g),
        (g = dd(c + 1 + "_" + f)) && g !== a && g.$b && 0 > b.indexOf(g) && b.push(g),
        (g = dd(c + "_" + (f - 1))) && g !== a && g.$b && 0 > b.indexOf(g) && b.push(g),
        (g = dd(c + "_" + (f + 1))) && g !== a && g.$b && 0 > b.indexOf(g) && b.push(g);
        for (c = 0; c < b.length; c++) b[c].$b = !1;
        Lc();
        ed(w.S);
        Ta("Castle", "已清空:" + a.mi);
        w.i.aa.Sr();
        Pc(a);
        nd(a);
        Kd(19);
        if (a = a.Ab) for (c = 0; c < a.length; c++) ge(w.Aa, a[c]);
        a = w.kb;
        for (b = c = 0; b < a.pd.length; b++) a.pd[b].cb || c++;
        if (0 === c) {
            w.i.wh++;
            w.Fe = !0;
            w.xu();
            px(w.pg);
            w.Ee.Me();
            a = w.i.Bg;
            b = w.i.D.length;
            4 > b && (1 === b ? (a.hn += 1, c = w.i.D[0].pa, (d = a.lq[c]) || (d = 0), a.lq[c] = d + 1) : 2 === b ? a.jn += 1 : 3 === b && (a.kn += 1));
            for (c = 0; c < b; c++) d = w.i.D[c].pa,
            (f = a.qo[d]) || (f = 0),
            a.qo[d] = f + 1;
            c = a.nm;
            0 < c && (c > a.Xm && (a.Xm = c), a.mm = c);
            if (4 <= b) {
                d = !0;
                f = w.i.D[0].pa;
                for (c = 1; c < b; c++) if (f != w.i.D[c].pa) {
                    d = !1;
                    break
                }
                d && (a.vn += 1)
            }
            c = w.i.Ih.Xj;
            a = m(c / 36E5);
            b = m(c / 6E4 % 60);
            c = m(c / 1E3 % 60);
            b = "Time: " + ((10 > a ? "0": "") + a + ":" + (10 > b ? "0": "") + b + ":" + (10 > c ? "0": "") + c) + ",胜利:" + w.i.wh;
            for (a = 0; a < w.i.D.length; a++) b += ", " + w.i.D[a].Kc.Ka + " (" + w.i.D[a].K.Eb + ")";
            Ta("Victory", b)
        }
    }
};
e.et = function(a) {
    this.Bc = a
};
e.rB = function(a) {
    this.ed = a
};
e.ou = function() {
    this.Wf && this.Wf.cb && (this.Wf = null);
    if (!this.Wf) {
        var a = w.kb,
        b = w.i.gg.p.Db,
        c = null,
        d = 0,
        f, g, h;
        for (h = 0; h < a.pd.length; h++) if (f = a.pd[h], !f.$b && !f.cb && (g = Kb(b, w.S.dc(f.dm), w.S.ec(f.em)), !c || g < d)) c = f,
        d = g;
        this.Wf = c
    }
    if (this.Wf) {
        a = !1;
        for (b = c = 0; b < w.i.D.length; b++) {
            d = w.i.D[b];
            f = d.Ld.items;
            if (0 === f.length) d = 0;
            else {
                var l = h = g = void 0,
                n = 0;
                for (g = 0; g < f.length; g++) h = f[g],
                (l = d.ef(h.r)) && !ss(h, l) && n++;
                d = n
            }
            c += d
        }
        b = c;
        if (this.Lf) 0 === b && (this.Lf = null);
        else if (0 < b) {
            a = w.ug;
            b = w.i.gg.p.Db;
            c = null;
            for (h = d = 0; h < a.ht.length; h++) if (f = a.ht[h], g = Kb(b, w.S.dc(f.iq), w.S.ec(f.jq)), !c || g < d) c = f,
            d = g;
            this.Lf = c;
            a = !0
        }
        if (this.Lf) this.ge = null,
        b = !1;
        else if (b = !1, this.ge) this.ge.Bj || (this.ge = null);
        else if (this.Wf.ye && !this.Wf.cb) this.ge = this.Wf,
        b = !0;
        else {
            c = w.kb;
            d = w.i.gg.p.Db;
            f = null;
            for (n = g = 0; n < c.Dh.length; n++) if (h = c.Dh[n], l = Kb(d, w.S.dc(h.dm), w.S.ec(h.em)), !f || l < g) f = h,
            g = l;
            if (c = f) this.Wf = this.ge = c,
            b = !0
        }
        if (this.Lf || this.ge) this.Wb = null,
        f = !1;
        else {
            c = !1;
            this.Wb && (this.Wb.oe ? this.Wb = null: this.Wb.Lc && (this.Wb = null));
            if (!this.Wb) {
                d = w.i.gg.p.Db;
                f = null;
                g = 0;
                var n = this.Wf.Ab,
                p;
                for (p = 0; p < n.length; p++) if (h = n[p], !h.cb && (l = Kb(d, h.dc(), h.ec()), !f || l < g)) f = h,
                g = l;
                this.Wb = f;
                if (!this.Wb) {
                    f = w.Aa;
                    g = null;
                    for (p = h = 0; p < f.Ab.length; p++)(l = f.Ab[p], l.oe || l.zj.$b || l.cb || (n = Kb(d, l.dc(), l.ec()), g && !(n < h))) || (g = l, h = n);
                    this.Wb = g;
                    if (!this.Wb) {
                        f = w.Aa;
                        g = null;
                        for (p = h = 0; p < f.Ab.length; p++)(l = f.Ab[p], l.oe || l.zj.$b || l.qf && (!l.qf || l.Lc) || (n = Kb(d, l.dc(), l.ec()), g && !(n < h))) || (g = l, h = n);
                        this.Wb = g;
                        if (!this.Wb) {
                            f = w.Aa;
                            g = null;
                            for (p = h = 0; p < f.Ab.length; p++) if (l = f.Ab[p], !l.oe && !l.zj.$b && (n = Kb(d, l.dc(), l.ec()), !g || n < h)) g = l,
                            h = n;
                            this.Wb = g
                        }
                    }
                }
                this.Wb && (c = !0)
            }
            f = c
        }
        if (this.Lf) c = this.Lf.iq,
        d = this.Lf.jq;
        else if (this.ge) c = this.ge.dm,
        d = this.ge.em;
        else if (this.Wb) c = this.Wb.bc(),
        d = this.Wb.cc();
        else return;
        if (a || f || b) w.S.hb(c, d) ? (gx(this.Ht, c, d), this.hp = !1) : (this.hp = !0, this.Nm = dg(c), this.Om = pg(d), gx(this.Ht, this.Nm, this.Om));
        else {
            if (a = this.hp) b = w.i.gg.p,
            a = this.Nm - w.S.bc(b.dc()),
            b = this.Om - w.S.cc(b.ec()),
            a = 8 > Math.sqrt(a * a + b * b);
            a && (w.S.hb(c, d) ? (gx(this.Ht, c, d), this.hp = !1) : (this.Nm = dg(c), this.Om = pg(d), gx(this.Ht, this.Nm, this.Om)))
        }
    }
};
e.nu = function() {
    a: {
        var a, b = Qd(),
        c;
        for (a = 0; a < b.length; a++) if (c = b[a], c.p.w && c.Ja.Kd) {
            this.Mp = !0;
            mx(this, c.p.w);
            break a
        }
        this.Mp = !1
    }
    if (!vu(this)) if (this.Ue) this.Cc = this.Ue.Nn,
    this.Bc = this.ed = null;
    else if (!this.ed && (!this.Bc || this.Bc.Mb)) {
        if (this.Cc) {
            if (a = this.Cc.Xi) a = xh(),
            a = 0 === a.length ? !0 : this.Cc !== a[0].p.w;
            if (a) this.Cc = null;
            else return
        }
        this.et(qx());
        this.Cc = this.Bc ? this.Bc ? this.Bc.$d: null: (this.ed = w.Ba.tf) ? this.ed.$d: null
    }
};
function qx() {
    var a = w.i.gg,
    b, c, d, f, g = null,
    h = a.p.u,
    l = w.Ba.Pa,
    n = w.Ba.gd,
    p = 1E5;
    if (b = a.p.cd) {
        if (!b.af.Mb) return b.af;
        if (!b.Be.Mb) return b.Be
    }
    if (d = a.p.w) {
        b = d.Nc;
        for (c = 0; c < b.length; c++) d = b[c],
        d.Mb || (g ? (f = Kb(h, d.me, d.ne), f < p && (g = d, p = f)) : (g = d, p = Kb(h, d.me, d.ne)));
        if (g) return g
    }
    for (a = 0; a < l.length; a++) if (d = l[a], d.Xi) for (b = d.Nc, c = 0; c < b.length; c++) d = b[c],
    d.Mb || (g ? (f = Kb(h, d.me, d.ne), f < p && (g = d, p = f)) : (g = d, p = Kb(h, d.me, d.ne)));
    for (a = 0; a < n.length; a++) b = n[a],
    b.Km && (d = b.af, d.Mb || (g ? (f = Kb(h, d.me, d.ne), f < p && (g = d, p = f)) : (g = d, p = Kb(h, d.me, d.ne))), d = b.Be, d.Mb || (g ? (f = Kb(h, d.me, d.ne), f < p && (g = d, p = f)) : (g = d, p = Kb(h, d.me, d.ne))));
    return g
};
var rx = {
    Fd: 2.1,
    Ed: 500,
    Vd: 1.005,
    Xd: 100
},
sx = {
    Fd: 1.5,
    Ed: 15,
    Vd: 1.017,
    Xd: 85
},
tx = {
    Fd: 1.5,
    Ed: 15,
    Vd: 1.017,
    Xd: 85
},
ux = {
    Fd: 1.6,
    Ed: 25,
    Vd: 1.017,
    Xd: 22
},
vx = {
    Fd: 1.8,
    Ed: 15,
    Vd: 1.015,
    Xd: 15
},
yi = {
    Fd: 1.7,
    Ed: 1,
    Vd: 1.0017,
    Xd: 30
},
zi = {
    Fd: 1.7,
    Ed: 1,
    Vd: 1.0017,
    Xd: 25
},
Ai = {
    Fd: 1.7,
    Ed: 1,
    Vd: 1.0017,
    Xd: 30
},
Bi = {
    Fd: 1.7,
    Ed: 1,
    Vd: 1.0017,
    Xd: 25
},
wi = {
    Fd: 1.7,
    Ed: 1,
    Vd: 1.0018,
    Xd: 15
},
xi = {
    Fd: 1.24,
    Ed: 1,
    Vd: 1.0002,
    Xd: 4
},
Qv = {
    Fd: 1.8,
    Ed: 15,
    Vd: 1.015,
    Xd: 15
},
Rv = {
    Fd: 1.8,
    Ed: 15,
    Vd: 1.015,
    Xd: 15
},
ex = {
    Fd: 1.7,
    Ed: 120,
    Vd: 1.018,
    Xd: 100
},
zs = {
    Fd: 1.02,
    Ed: 100,
    Vd: 1.01,
    Xd: 100
},
Eq = {
    Fd: 1.4,
    Ed: 250,
    Vd: 1.018,
    Xd: 100
},
qs = {
    Fd: 1.02,
    Ed: 50,
    Vd: 1.01,
    Xd: 100
},
vi = 20,
Xw = 1.3,
Ww = 1.5,
Lw = 25,
Kw = 25,
Jw = 1,
$v = 20,
ax = 0.4,
bx = 0.3,
aw = 10,
Ss = {
    t: 1,
    defaultValue: 1,
    lf: 0.1
},
ce = {
    t: 1,
    defaultValue: 1,
    lf: -0.1
},
As = {
    t: 1,
    defaultValue: 1,
    lf: -0.1
},
Dq = {
    t: 0,
    defaultValue: 0,
    lf: 10
},
tr = {
    t: 0,
    defaultValue: 0,
    lf: 1
},
Rs = {
    t: 0,
    defaultValue: 0,
    lf: 1
},
Ts = {
    t: 0,
    defaultValue: 0,
    lf: 120
},
Us = {
    t: 0,
    defaultValue: 0,
    lf: 20
},
Vs = {
    t: 0,
    defaultValue: 0,
    lf: 72E5
},
Ws = {
    t: 0,
    defaultValue: 0,
    lf: 0.01
},
Xs = {
    t: 0,
    defaultValue: 0,
    lf: -1
},
Ys = {
    t: 0,
    defaultValue: 0,
    lf: 1
},
Zs = {
    t: 0,
    defaultValue: 0,
    lf: 1
},
sr = 6,
Yq = {
    t: 1,
    defaultValue: 1,
    nc: 2
},
Xq = {
    t: 1,
    defaultValue: 1,
    nc: 2
},
Zq = {
    t: 1,
    defaultValue: 1,
    nc: 2
},
$q = {
    t: 1,
    defaultValue: 1,
    nc: 1.25
},
ar = {
    t: !1,
    defaultValue: !1,
    nc: !0
},
br = {
    t: !1,
    defaultValue: !1,
    nc: !0
},
cr = {
    t: !1,
    defaultValue: !1,
    nc: !0
},
Sh = {
    t: 0,
    defaultValue: 0,
    nc: 10
},
dr = {
    t: !1,
    defaultValue: !1,
    nc: !0
},
er = {
    t: !1,
    defaultValue: !1,
    nc: !0
},
fr = {
    t: !1,
    defaultValue: !1,
    nc: !0
},
gr = {
    t: 1,
    defaultValue: 1,
    nc: 2
},
hr = {
    t: !1,
    defaultValue: !1,
    nc: !0
},
ir = {
    t: 1,
    defaultValue: 1,
    nc: 1.2
},
Zh = {
    t: !1,
    defaultValue: !1,
    nc: !0
},
jr = {
    t: !1,
    defaultValue: !1,
    nc: !0
},
kr = {
    t: !1,
    defaultValue: !1,
    nc: !0
},
lr = {
    t: !1,
    defaultValue: !1,
    nc: !0
},
Bg = {
    t: !1,
    defaultValue: !1,
    nc: !0
},
Qh = {
    t: !1,
    defaultValue: !1,
    nc: !0
},
cx = 15,
dx = 10,
$g = 5,
ah = 10,
Zg = 5,
E = {
    ls: {
        c: "itemDropChance",
        title: "更多道具掉落",
        e: "每次杀怪道具掉落几率+2%",
        t: 40,
        xf: 40,
        $g: 2,
        md: 0,
        maxValue: 100,
        rd: 40,
        ah: 1,
        Pg: 11
    },
    Pj: {
        c: "maxMonstersPerRoom",
        title: "等多怪物",
        e: "房间内最多怪物数量(+2)",
        t: 8,
        xf: 8,
        $g: 2,
        md: 0,
        maxValue: 50,
        rd: 100,
        ah: 2,
        Pg: 11
    },
    Ym: {
        c: "minMonstersPerRoom",
        title: "平均怪物计数",
        e: "房间内最少怪物数量(+1)",
        t: 0,
        xf: 0,
        $g: 1,
        md: 0,
        maxValue: 50,
        rd: 140,
        ah: 2,
        Pg: 11
    },
    Yl: {
        c: "betterItemRarityChance",
        title: "稀有道具掉落",
        e: "更加稀有道具掉落几率(+2%)",
        t: 0,
        xf: 0,
        $g: 2,
        md: 0,
        maxValue: 30,
        rd: 120,
        ah: 3,
        Pg: 11
    },
    lp: {
        c: "itemLevelBonus",
        title: "道具等级加成",
        e: "更高等级道具掉落几率(+3%)",
        t: 0,
        xf: 0,
        $g: 3,
        md: 0,
        maxValue: 30,
        rd: 160,
        ah: 4,
        Pg: 11
    },
    ys: {
        c: "maxGoldPerDrop",
        title: "最大黄金掉落",
        e: "最大掉落黄金数量+25",
        t: 15,
        xf: 15,
        $g: 25,
        md: 0,
        maxValue: 2500,
        rd: 200,
        ah: 6,
        Pg: 11
    },
    As: {
        c: "minGoldPerDrop",
        title: "最小黄金掉落",
        e: "最小掉落黄金数量+10",
        t: 0,
        xf: 0,
        $g: 10,
        md: 0,
        maxValue: 2E3,
        rd: 300,
        ah: 10,
        Pg: 11
    },
    Lr: {
        c: "goldDropChance",
        title: "更多黄金掉落",
        e: "每次杀怪黄金掉落几率+5%",
        t: 25,
        xf: 25,
        $g: 5,
        md: 0,
        maxValue: 100,
        rd: 200,
        ah: 5,
        Pg: 11
    },
    $s: {
        c: "scrollDropChance",
        title: "更多卷轴掉落",
        e: "每次杀怪卷轴掉落几率+2%",
        t: 20,
        xf: 20,
        $g: 2,
        md: 0,
        maxValue: 40,
        rd: 200,
        ah: 7,
        Pg: 11
    },
    Ns: {
        c: "potionDropChance",
        title: "更多药剂掉落",
        e: "每次杀怪药剂掉落几率+0.5%",
        t: 1,
        xf: 1,
        $g: 0.5,
        md: 0,
        maxValue: 5,
        rd: 300,
        ah: 8,
        Pg: 11
    },
    Et: {
        c: "treasureChestChance",
        title: "更多财宝箱",
        e: "遇到财宝箱几率+2%",
        t: 5,
        xf: 5,
        $g: 2,
        md: 0,
        maxValue: 20,
        rd: 340,
        ah: 9,
        Pg: 11
    }
},
Bs = 5,
Uv = 0.1,
Tv = 0.15,
Vv = [0.8, 0.16, 0.036, 0.0036, 4E-4],
Ov = [{
    Vp: 0,
    pp: 1,
    jp: 0.2
},
{
    Vp: 1,
    pp: 1.2,
    jp: 0.5
},
{
    Vp: 2,
    pp: 1.35,
    jp: 0.75
},
{
    Vp: 3,
    pp: 1.5,
    jp: 0.9
},
{
    Vp: 4,
    pp: 1.65,
    jp: 0.99
}],
lc = 170,
kc = 60,
wx = {},
xx = E,
yx,
zx;
for (yx in xx) Object.prototype.hasOwnProperty.call(xx, yx) && (zx = xx[yx], zx.c ? wx[zx.c] ? console.log("setting object duplicate settingId: " + zx.c + " setting: " + yx) : wx[zx.c] = zx: console.log("setting object missing settingId: " + yx));
function Dg() {
    var a = E.As.t,
    b = Math.max(0, E.ys.t - a),
    c = Xq.t;
    return (a + k(b)) * c
};
var Ax = [new us(0), new us(1), new us(2), new us(3), new us(4)],
Bx = [new rs(5), new ts(0, 5), new ts(1, 5), new ts(2, 5), new ts(3, 5), new ts(4, 5)],
Cx = [new ns(E.Lr), new ns(E.ys), new ns(E.As), new ns(E.ls), new ns(E.$s), new ns(E.Ns), new ns(E.Yl), new ns(E.Pj), new ns(E.Ym), new ns(E.lp), new ns(E.Et)],
Dx,
Ex = [];
for (Dx = 0; Dx < Pq.length; Dx++) Ex.push(new Js(Pq[Dx].qg));
var Fx = [new ys, new Cs],
Gx = [new Gs(0), new Gs(1), new Gs(2), new Gs(3)],
Hx = [new ms(0), new ms(1), new ms(2), new ms(3)],
Ix = [new Ls(0), new Ls(1), new Ls(2), new Ls(3)],
Jx = [new Hs, new $s],
Kx = new is([Cx, Fx], !0),
Lx = new is([Ax], !1),
Mx = new is([Jx, Ax, Bx, Cx, Fx, Gx, Hx, Ix, Ex], !0),
Nx = [Kx, Lx, Mx];
function M(a) {
    return document.getElementById(a)
}
function P(a, b, c, d) {
    a = document.createElement(a);
    d && (a.className = d);
    c && (a.id = c);
    b && b.appendChild(a);
    return a
}
function Ox(a) {
    if (a = M(a)) for (; a.firstChild;) a.removeChild(a.firstChild)
}
function Px(a) {
    if (a) for (; a.firstChild;) a.removeChild(a.firstChild)
}
function Qx(a) {
    a && (a.style.display = "none")
}
function Rx(a) {
    a && (a.style.display = "block")
}
function Sx(a) {
    Qx(M(a))
}
function Tx(a) {
    Rx(M(a))
}
function Ux(a, b) {
    var c = M(a);
    c && (c.innerHTML = b)
}
function Vx(a) {
    var b = document.createElement("th");
    a.appendChild(b);
    return b
}
function Wx(a, b, c) {
    a = a.insertRow(c);
    c = a.insertCell(0);
    c.className = "characteristicsTableLabel";
    c.innerHTML = b;
    return a.insertCell(1)
};
function Xx() {
    this.F = null;
    this.Vw = !1
}
Xx.prototype.Pm = function() {
    return this.Ya
};
Xx.prototype.J = function() {};
Xx.prototype.Xa = function() {
    if (this.F) {
        var a = this.Pm();
        this.Vw != a && ((this.Vw = a) ? Tx(this.F) : Sx(this.F));
        a && this.ba()
    }
};
Xx.prototype.ba = function() {};
function Yx() {
    this.Lg = null
}
Yx.prototype = new Xx;
function R(a, b) {
    b && (a.Lg || (a.Lg = []), a.Lg.push(b))
}
Yx.prototype.J = function() {
    Zx(this)
};
Yx.prototype.ba = function() {
    $x(this)
};
function Zx(a) {
    if (a.Lg) {
        var b;
        for (b = 0; b < a.Lg.length; b++) a.Lg[b].J()
    }
}
function $x(a) {
    if (a.Lg) {
        var b;
        for (b = 0; b < a.Lg.length; b++) a.Lg[b].Xa()
    }
};
function ay() {
    this.F = "gameContainer";
    this.Ya = !0;
    this.um = [0, 0, 0, 0, 0];
    this.Gh = [];
    this.Tc = [];
    this.Bd = null
}
ay.prototype = new Yx;
e = ay.prototype;
e.Me = function() {
    var a;
    for (a = 0; a < this.Tc.length; a++) this.Tc[a].Me()
};
e.Zd = function() {
    if (!w.Fe && w.lg) {
        var a;
        for (a = 0; a < this.Tc.length; a++) this.Tc[a].Zd()
    }
};
e.Ne = function() {
    if (!w.Fe && w.lg) {
        var a;
        for (a = 0; a < this.Tc.length; a++) this.Tc[a].Ne()
    }
};
e.Js = function() {
    this.Bd.Js();
    var a;
    for (a = 0; a < this.um.length; a++) this.um[a] = 0
};
e.J = function() {
    var a;
    for (a = 0; a < this.um.length; a++) this.um[a] = 0;
    Zx(this)
};
e.ba = function() {
    var a, b, c;
    for (a = 0; a < w.i.D.length; a++) b = w.i.D[a],
    c = this.tw(b),
    this.um[a] !== c && (this.um[a] = c, b = b.Kc.vg, 0 < c ? (this.Gh[a].label = b + " " + c, this.Gh[a].qh = !0) : (this.Gh[a].label = b, this.Gh[a].qh = !1));
    $x(this)
};
e.tw = function(a) {
    return a.Zi ? a.de + a.Ci: 0
};
function by() {
    this.Vu = !w.Mh;
    this.sl = null;
    this.F = "pauseButtonContainer";
    this.Ya = !0
}
by.prototype = new Xx;
by.prototype.ba = function() {
    this.sl || cy(this);
    this.Vu != w.Mh && ((this.Vu = w.Mh) ? (this.sl.innerHTML = "恢复", this.sl.className = "ownedUpgradeButton") : (this.sl.innerHTML = "暂停", this.sl.className = "upgradeButton"))
};
function cy(a) {
    a.sl = M("pauseButton");
    a.sl.onmouseup = function() {
        w.Mh = !w.Mh;
        return ! 1
    }
};
function dy(a, b) {
    this.label = a;
    this.qa = this.IC = b;
    this.qh = this.ha = !1
};
function ey(a) {
    this.C = a;
    this.tt = this.Kl = null;
    this.qa = !a.IC;
    this.ha = !a.ha;
    this.qh = !a.qh;
    this.gv = null
}
ey.prototype.J = function() {
    this.gv = null
};
ey.prototype.Xa = function() {
    var a = this.C.qa;
    this.qa !== a && ((this.qa = a) ? Rx(this.Kl) : Qx(this.Kl));
    if (a) {
        a = this.C.label;
        this.gv !== a && (this.gv = a, this.tt.innerHTML = a);
        var a = this.C.ha,
        b = this.C.qh;
        if (this.ha != a || this.qh != b) this.ha = a,
        this.qh = b,
        this.Kl.className = a ? b ? "selectedTab tabHighlighted": "selectedTab": b ? "tabHighlighted": ""
    }
};
function fy(a, b, c) {
    a.Kl = P("li", b, null, null);
    a.qa || Qx(a.Kl);
    a.Kl.className = a.ha ? "selectedTab": "";
    a.tt = P("a", a.Kl, null, null);
    a.tt.innerHTML = a.C.label;
    a.tt.onclick = function() {
        var b = a.C,
        f;
        for (f = 0; f < c.Fn.length; f++) c.Fn[f].ha = c.Fn[f] === b;
        return ! 1
    }
};
function gy(a) {
    this.F = a;
    this.Fn = [];
    this.Ll = []
}
function hy(a, b) {
    a.Fn.push(b)
}
gy.prototype.J = function() {
    iy(this)
};
gy.prototype.Xa = function() {
    var a;
    for (a = 0; a < this.Ll.length; a++) this.Ll[a].Xa()
};
gy.prototype.Js = function() {
    var a, b;
    for (a = 0; a < this.Ll.length; a++) b = this.Ll[a].C,
    b.qa = b.IC,
    b.qh = !1,
    b.ha = 0 === a
};
function iy(a) {
    Ox(a.F);
    var b = M(a.F);
    if (b) {
        var b = P("ul", b, null, null),
        c,
        d;
        0 < a.Ll.length && (a.Ll.length = 0);
        for (d = 0; d < a.Fn.length; d++) c = new ey(a.Fn[d]),
        fy(c, b, a),
        a.Ll.push(c)
    }
};
function jy() {
    this.C = null
}
jy.prototype = new Yx;
e = jy.prototype;
e.ba = function() {
    this.C.qa && this.C.ha && $x(this)
};
e.Pm = function() {
    return this.C.qa && this.C.ha
};
e.Me = function() {};
e.Zd = function() {};
e.Ne = function() {};
function ky(a, b, c, d) {
    this.F = a + "_" + c;
    this.Ya = !0;
    this.QA = a;
    this.H = b;
    this.Ag = null;
    this.GC = d;
    this.zo = this.W = null;
    this.ti = ""
}
ky.prototype = new Xx;
e = ky.prototype;
e.Rc = function(a) {
    this.H = a;
    this.Ag && this.Ag.Rc(a);
    this.GC || this.H.Oc() || this.W && Qx(this.W)
};
e.Pm = function() {
    return this.GC ? !0 : this.H && this.H.Oc()
};
e.J = function() {
    M(this.QA) && (this.W = null, ly(this), this.zo = this.Ag = null)
};
function ly(a) {
    var b = M(a.QA);
    a.ti = a.Ro();
    a.W = P("div", b, a.F, a.ti);
    a.W.onmouseup = function() {
        a.Qc();
        return ! 1
    }
}
e.Qc = function() {
    this.H.qc() && this.H.Qc()
};
e.ba = function() {
    var a = this.H.Na(),
    b = this.Ro();
    this.W || ly(this);
    this.zo !== a && (this.zo = a, this.Ag && this.zo !== this.Ag.Na() && (Px(this.W), this.Ag = null), this.Ag || (this.Ag = my(this, this.zo)), this.Ag && this.Ag.te());
    this.Ag && this.Ag.ba();
    this.ti !== b && (this.ti = b, this.W.className = b)
};
e.Ro = function() {
    return this.H.qc() ? "upgradeButton centeredElement topMargin": this.H.He() ? "ownedUpgradeButton centeredElement topMargin": "disabledUpgradeButton centeredElement topMargin"
};
function my(a, b) {
    switch (b) {
    case 1:
        return new ny(a.H, a.W);
    case 2:
        return new oy(a.H, a.W);
    case 3:
        return new py(a.H, a.W);
    case 4:
        return new qy(a.H, a.W);
    case Pi:
        return new ry(a.H, a.W);
    case 6:
        return new sy(a.H, a.W);
    case 7:
        return new ty(a.H, a.W);
    case 8:
        return new uy(a.H, a.W);
    case 9:
        return new vy(a.H, a.W);
    case 10:
        return new wy(a.H, a.W);
    case 11:
        return new xy(a.H, a.W);
    case 12:
        return new yy(a.H, a.W);
    case 13:
        return new zy(a.H, a.W);
    case 14:
        return new Ay(a.H, a.W);
    case 15:
        return new By(a.H, a.W);
    case 16:
        return new Cy(a.H, a.W);
    default:
        return null
    }
};
function ny(a, b) {
    this.H = a;
    this.W = b;
    this.Ii = this.Ji = this.Hi = this.rp = this.Lj = null;
    this.sa = !1;
    this.Lb = -1;
    this.gb = this.fb = null
}
e = ny.prototype;
e.Na = function() {
    return 1
};
e.J = function() {
    this.Lb = -1;
    this.gb = this.fb = null
};
e.Rc = function(a) {
    this.H = a
};
e.te = function() {
    this.Lj || this.eb();
    this.sa || (Rx(this.Lj), Rx(this.rp), this.sa = !0)
};
e.ba = function() {
    var a = this.H.Bb(),
    b = this.H.ib(),
    c = this.H.lb();
    this.Lb !== a && (this.Lb = a, this.Hi.innerHTML = r(a));
    this.gb !== b && (this.gb = b, this.Ji.innerHTML = b);
    this.fb !== c && (this.fb = c, this.Ii.innerHTML = c)
};
e.eb = function() {
    this.Lj = P("div", this.W, null, null);
    this.Lj.style.position = "relative";
    this.Lj.style.height = "30px";
    this.rp = P("div", this.W, null, null);
    this.rp.style.position = "relative";
    this.rp.style.height = "30px";
    var a = P("div", this.Lj, null, null);
    a.style.position = "absolute";
    a.style.right = "3px";
    a.style.top = "0";
    a.style.width = "30px";
    a.style.height = "100%";
    a.style.textAlign = "left";
    a.style.background = "url('spritesheet/terrain.png') -1302px -363px";
    a = P("img", a, null, null);
    a.src = "images/Transparent.gif";
    a.style.width = "100%";
    a.style.height = "15px";
    this.Hi = P("div", this.Lj, null, null);
    this.Hi.style.position = "absolute";
    this.Hi.style.right = "36px";
    this.Hi.style.top = "0";
    this.Hi.style.width = "40px";
    this.Hi.style.height = "25px";
    this.Hi.style.paddingTop = "5px";
    this.Hi.style.textAlign = "right";
    this.Ji = P("div", this.Lj, null, null);
    this.Ji.style.position = "absolute";
    this.Ji.style.right = "82px";
    this.Ji.style.top = "0";
    this.Ji.style.left = "3px";
    this.Ji.style.height = "25px";
    this.Ji.style.paddingTop = "5px";
    this.Ji.style.textAlign = "left";
    this.Ii = P("div", this.rp, null, null);
    this.Ii.style.position = "absolute";
    this.Ii.style.left = "3px";
    this.Ii.style.top = "0";
    this.Ii.style.right = "0";
    this.Ii.style.height = "25px";
    this.Ii.style.paddingTop = "5px";
    this.Ii.style.textAlign = "left"
};
function oy(a, b) {
    this.H = a;
    this.W = b;
    this.Sy = this.Py = this.Ry = this.Ty = this.hm = this.table = null;
    this.sa = !1;
    this.Iu = null;
    this.Ju = -1
}
e = oy.prototype;
e.Na = function() {
    return 2
};
e.J = function() {
    this.Iu = null;
    this.Ju = -1
};
e.Rc = function(a) {
    this.H = a
};
e.te = function() {
    this.table || this.eb();
    this.sa || (Rx(this.table), this.sa = !0)
};
e.ba = function() {
    if (this.H.Vo()) {
        var a = this.H.Vo(),
        b = a.K.Eb;
        if (this.Iu !== a || this.Ju != b) {
            this.Iu = a;
            this.Ju = b;
            var c = a.v(),
            d = a.Kc.Ma;
            this.hm.style.background = "url('spritesheet/monsters.png') -" + (c.ub + 10) + "px -" + (c.vb + 12) + "px";
            this.Ty.innerHTML = this.H.lb();
            this.aD.innerHTML = r(a.K.Am) + " XP";
            this.Ry.innerHTML = "等级 " + (b + 1);
            this.Py.innerHTML = ", " + r(Ia(b + 1, sx, d.Cf)) + " HP";
            this.Sy.innerHTML = ", " + r(Ia(b + 1, tx, d.Ef)) + " SP"
        }
    } else console.log("bug in upgrade button")
};
e.eb = function() {
    this.table = P("table", this.W, null, null);
    this.table.style.width = "100%";
    var a = this.table.insertRow(0),
    b = this.table.insertRow(1),
    c = a.insertCell(0);
    c.style.width = "30px";
    c.style.height = "30px";
    c.style.verticalAlign = "top";
    this.hm = P("img", c, null, null);
    this.hm.className = "characterImage";
    this.hm.src = "images/Transparent.gif";
    this.hm.style.height = "30px";
    this.hm.style.width = "30px";
    c = a.insertCell(1);
    c.style.width = "180px";
    c.style.textAlign = "left";
    c.style.paddingLeft = "3px";
    this.Ty = P("span", c, null, null);
    a = a.insertCell(2);
    a.style.width = "40px";
    a.style.textAlign = "right";
    this.aD = P("span", a, null, null);
    b = b.insertCell(0);
    b.colSpan = 3;
    b.style.paddingLeft = "2px";
    b.style.textAlign = "left";
    b.style.verticalAlign = "middle";
    this.Ry = P("span", b, null, null);
    this.Py = P("span", b, null, null);
    this.Sy = P("span", b, null, null)
};
function py(a, b) {
    this.H = a;
    this.W = b;
    this.ks = this.iA = this.Fw = this.jA = this.Qm = this.kp = this.Bf = null;
    this.sa = !1;
    this.cv = null
}
e = py.prototype;
e.Na = function() {
    return 3
};
e.J = function() {
    this.cv = null
};
e.Rc = function(a) {
    this.H = a
};
e.te = function() {
    this.Bf || this.eb();
    this.sa || (Rx(this.Bf), this.sa = !0)
};
e.ba = function() {
    var a = this.H.Oz();
    if (this.cv !== a) {
        this.cv = a;
        var b = a.Uk(),
        c = a.nj.v();
        this.kp.style.background = "url('spritesheet/items.png') -" + b.ub + "px -" + b.vb + "px";
        this.jA.innerHTML = Lv(a);
        this.Fw.className = Dy(a.uf());
        this.Fw.innerHTML = " (" + Kv(a) + ")";
        this.Qm.style.background = "url('spritesheet/monsters.png') -" + (c.ub + 10) + "px -" + (c.vb + 12) + "px";
        this.iA.innerHTML = "等级" + a.ns;
        b = (b = a.nj.ef(a.r)) ? a.va - b.va: a.va;
        this.ks.innerHTML = 0 < b ? "+" + r(b) + " " + Jv(a) : r(b) + " " + Jv(a)
    }
};
e.eb = function() {
    this.Bf = P("table", this.W, null, null);
    this.Bf.style.width = "100%";
    var a = this.Bf.insertRow(0),
    b = this.Bf.insertRow(1),
    c = a.insertCell(0);
    c.style.width = "30px";
    c.style.height = "30px";
    c.style.textAlign = "center";
    this.kp = P("img", c, null, null);
    this.kp.src = "images/Transparent.gif";
    this.kp.style.width = "30px";
    this.kp.style.height = "30px";
    a = a.insertCell(1);
    a.style.textAlign = "left";
    a.colSpan = 2;
    this.jA = P("span", a, null, null);
    this.Fw = P("span", a, null, null);
    a = b.insertCell(0);
    a.style.width = "30px";
    a.style.height = "30px";
    a.style.verticalAlign = "top";
    this.Qm = P("img", a, null, null);
    this.Qm.className = "characterImage";
    this.Qm.src = "images/Transparent.gif";
    this.Qm.style.height = "30px";
    this.Qm.style.width = "30px";
    a = b.insertCell(1);
    a.style.width = "70px";
    a.style.paddingLeft = "2px";
    a.style.textAlign = "left";
    this.iA = P("span", a, null, null);
    b = b.insertCell(2);
    b.style.width = "140px";
    b.style.paddingLeft = "2px";
    b.style.textAlign = "right";
    this.ks = P("span", b, null, null);
    this.ks.style.marginLeft = "10px";
    this.ks.style.color = "#0A0"
};
function zy(a, b) {
    this.H = a;
    this.W = b;
    this.mf = this.we = this.mo = this.$e = null;
    this.sa = !1;
    this.oz = this.fb = ""
}
e = zy.prototype;
e.Na = function() {
    return 13
};
e.J = function() {
    this.gb = this.fb = ""
};
e.Rc = function(a) {
    this.H = a
};
e.te = function() {
    this.$e || this.eb();
    this.sa || (Rx(this.$e), this.sa = !0)
};
e.ba = function() {
    var a = this.H.lb(),
    b = this.H.ib();
    this.oz != b && (this.oz = b, this.we.innerHTML = b);
    this.fb != a && (this.fb = a, this.mf.innerHTML = a)
};
e.eb = function() {
    this.$e = P("table", this.W, null, null);
    this.$e.style.width = "100%";
    var a = this.$e.insertRow(0),
    b = this.$e.insertRow(1),
    c = a.insertCell(0);
    c.rowSpan = 2;
    c.style.width = "50px";
    c.style.height = "50px";
    c.style.textAlign = "center";
    this.mo = P("img", c, null, null);
    this.mo.src = "images/Transparent.gif";
    this.mo.style.width = "50px";
    this.mo.style.height = "50px";
    c = w.I.v(w.kb.Ny);
    this.mo.style.background = "url('spritesheet/terrain.png') -" + c.ub + "px -" + c.vb + "px";
    a = a.insertCell(1);
    a.style.textAlign = "left";
    this.we = P("span", a, null, null);
    this.we.innerHTML = this.H.ib();
    this.mf = b.insertCell(0);
    this.mf.colSpan = 2;
    this.mf.style.width = "200px";
    this.mf.style.textAlign = "left"
};
function qy(a, b) {
    this.H = a;
    this.W = b;
    this.IA = [];
    this.JA = [];
    this.Rw = [];
    this.Bf = null;
    this.sa = !1;
    this.sr = []
}
e = qy.prototype;
e.Na = function() {
    return 4
};
e.J = function() {
    this.sr.length = 0
};
e.Rc = function(a) {
    this.H = a
};
e.te = function() {
    this.Bf || this.eb();
    this.sa || (Rx(this.Bf), this.sa = !0)
};
e.ba = function() {
    var a = this.H.Nz(),
    b,
    c,
    d,
    f = Math.min(5, a.length);
    for (b = 0; b < f; b++) if (c = a[b], this.sr.length < b || this.sr[b] !== c) this.sr[b] = c,
    d = c.Uk(),
    this.IA[b].style.background = "url('spritesheet/items.png') -" + d.ub + "px -" + d.vb + "px",
    this.JA[b].innerHTML = Lv(c),
    this.Rw[b].className = Dy(c.uf()),
    this.Rw[b].innerHTML = " (" + Kv(c) + ")"
};
e.eb = function() {
    this.Bf = P("table", this.W, null, null);
    this.Bf.style.width = "100%";
    var a = this.Bf.insertRow(0).insertCell(0);
    a.colSpan = 2;
    a.style.textAlign = "left";
    a.innerHTML = "装备所有道具升级";
    Ey(this, 1);
    Ey(this, 2);
    Ey(this, 3);
    Ey(this, 4);
    Ey(this, 5)
};
function Ey(a, b) {
    var c = a.Bf.insertRow(b),
    d = c.insertCell(0);
    d.style.width = "30px";
    d.style.height = "30px";
    d.style.textAlign = "center";
    d = P("img", d, null, null);
    d.src = "images/Transparent.gif";
    d.style.width = "30px";
    d.style.height = "30px";
    a.IA.push(d);
    c = c.insertCell(1);
    c.style.textAlign = "left";
    a.JA.push(P("span", c, null, null));
    a.Rw.push(P("span", c, null, null))
};
function ry(a, b) {
    this.H = a;
    this.W = b;
    this.sb = this.jb = this.kq = this.wn = null;
    this.sa = !1;
    this.gb = this.fb = null
}
e = ry.prototype;
e.Na = function() {
    return Pi
};
e.J = function() {
    this.gb = this.fb = null
};
e.Rc = function(a) {
    this.H = a
};
e.te = function() {
    this.wn || this.eb();
    this.sa || (Rx(this.wn), Rx(this.kq), this.sa = !0)
};
e.ba = function() {
    var a = this.H.ib(),
    b = this.H.lb();
    this.gb !== a && (this.gb = a, this.jb.innerHTML = a);
    this.fb !== b && (this.fb = b, this.sb.innerHTML = b)
};
e.eb = function() {
    this.wn = P("div", this.W, null, null);
    this.wn.style.position = "relative";
    this.wn.style.height = "30px";
    this.kq = P("div", this.W, null, null);
    this.kq.style.position = "relative";
    this.kq.style.height = "30px";
    this.jb = P("div", this.wn, null, null);
    this.jb.style.position = "absolute";
    this.jb.style.top = "0";
    this.jb.style.left = "3px";
    this.jb.style.right = "3px";
    this.jb.style.height = "25px";
    this.jb.style.paddingTop = "5px";
    this.jb.style.textAlign = "left";
    this.sb = P("div", this.kq, null, null);
    this.sb.style.position = "absolute";
    this.sb.style.left = "3px";
    this.sb.style.top = "0";
    this.sb.style.right = "0";
    this.sb.style.height = "25px";
    this.sb.style.paddingTop = "5px";
    this.sb.style.textAlign = "left"
};
function sy(a, b) {
    this.H = a;
    this.W = b;
    this.vu = this.Ml = this.yn = this.table = null;
    this.sa = !1;
    this.zn = this.Dx = this.Lv = null;
    this.nd = !0;
    this.De = this.oc = 0;
    this.qw = 8
}
e = sy.prototype;
e.Na = function() {
    return 6
};
e.J = function() {
    this.Lv = null
};
e.Rc = function(a) {
    this.H = a
};
e.te = function() {
    this.table || this.eb();
    this.sa || (Rx(this.table), this.sa = !0)
};
e.ba = function() {
    var a = this.H.uw();
    if (this.Lv !== a) {
        this.Lv = a;
        var b = a.ga;
        10 === b || 9 === b || 17 === b || 11 === b ? (a = kv[a.ta].d, this.Dx = w.fh, this.zn = w.fh.v(a), this.nd = !1, this.yn.style.background = "url('spritesheet/monsters.png') -" + (this.zn.ub + 10) + "px -" + (this.zn.vb + 12) + "px") : (a = a.ca, this.Dx = w.Dj.Yh[a], this.zn = w.Dj.Zg(a), this.De = this.oc = 0, this.nd = !0);
        this.Ml.innerHTML = this.H.ib();
        this.vu.innerHTML = this.H.lb()
    }
    this.nd && (this.De++, this.De >= this.qw && (this.De = 0, this.oc++, this.oc >= this.zn.To() && (this.oc = 0), a = this.zn.qq[this.oc], this.yn.style.background = "url('" + this.Dx.fileName + "') -" + a.qt + "px -" + a.rt + "px"))
};
e.eb = function() {
    this.table = P("table", this.W, null, null);
    this.table.style.width = "100%";
    this.table.style.height = "60px";
    var a = this.table.insertRow(0),
    b = this.table.insertRow(1),
    c = a.insertCell(0),
    a = a.insertCell(1);
    c.style.width = "29px";
    c.style.height = "29px";
    c.style.textAlign = "center";
    a.style.width = "180px";
    a.style.textAlign = "left";
    this.yn = P("img", c, null, null);
    this.yn.src = "images/Transparent.gif";
    this.yn.style.width = "29px";
    this.yn.style.height = "29px";
    this.Ml = P("span", a, null, null);
    this.Ml.style.paddingTop = "5px";
    this.Ml.style.textAlign = "left";
    b = b.insertCell(0);
    b.colSpan = 2;
    b.style.textAlign = "left";
    this.vu = P("span", b, null, null);
    this.vu.style.paddingTop = "5px"
};
function ty(a, b) {
    this.H = a;
    this.W = b;
    this.ej = this.fj = this.dj = this.Dq = this.kk = null;
    this.sa = !1;
    this.Lb = -1;
    this.gb = this.fb = null
}
e = ty.prototype;
e.Na = function() {
    return 7
};
e.J = function() {
    this.Lb = -1;
    this.gb = this.fb = null
};
e.Rc = function(a) {
    this.H = a
};
e.te = function() {
    this.kk || this.eb();
    this.sa || (Rx(this.kk), Rx(this.Dq), this.sa = !0)
};
e.ba = function() {
    var a = this.H.Bb(),
    b = this.H.ib(),
    c = this.H.lb();
    this.Lb !== a && (this.Lb = a, this.dj.innerHTML = r(a));
    this.gb !== b && (this.gb = b, this.fj.innerHTML = b);
    this.fb !== c && (this.fb = c, this.ej.innerHTML = c)
};
e.eb = function() {
    this.kk = P("div", this.W, null, null);
    this.kk.style.position = "relative";
    this.kk.style.height = "30px";
    this.Dq = P("div", this.W, null, null);
    this.Dq.style.position = "relative";
    this.Dq.style.height = "30px";
    var a = P("div", this.kk, null, null);
    a.style.position = "absolute";
    a.style.right = "3px";
    a.style.top = "0";
    a.style.width = "30px";
    a.style.height = "100%";
    a.style.textAlign = "left";
    a.style.background = "url('spritesheet/items.png') -1464px -73px";
    a = P("img", a, null, null);
    a.src = "images/Transparent.gif";
    a.style.width = "100%";
    a.style.height = "15px";
    this.dj = P("div", this.kk, null, null);
    this.dj.style.position = "absolute";
    this.dj.style.right = "36px";
    this.dj.style.top = "0";
    this.dj.style.width = "40px";
    this.dj.style.height = "25px";
    this.dj.style.paddingTop = "5px";
    this.dj.style.textAlign = "right";
    this.fj = P("div", this.kk, null, null);
    this.fj.style.position = "absolute";
    this.fj.style.right = "82px";
    this.fj.style.top = "0";
    this.fj.style.left = "3px";
    this.fj.style.height = "25px";
    this.fj.style.paddingTop = "5px";
    this.fj.style.textAlign = "left";
    this.ej = P("div", this.Dq, null, null);
    this.ej.style.position = "absolute";
    this.ej.style.left = "3px";
    this.ej.style.top = "0";
    this.ej.style.right = "0";
    this.ej.style.height = "25px";
    this.ej.style.paddingTop = "5px";
    this.ej.style.textAlign = "left"
};
function uy(a, b) {
    this.H = a;
    this.W = b;
    this.ui = this.Vg = this.we = this.Nd = this.bf = this.Cq = null;
    this.sa = !1;
    this.Lb = -1
}
e = uy.prototype;
e.Na = function() {
    return 8
};
e.J = function() {
    this.Lb = -1;
    this.ui = null
};
e.Rc = function(a) {
    this.H = a
};
e.te = function() {
    this.bf || this.eb();
    this.sa || (Rx(this.bf), this.sa = !0)
};
e.ba = function() {
    var a = this.H.Bb(),
    b = this.H.Wo();
    this.Lb !== a && (this.Lb = a, this.Cq.innerHTML = r(a));
    this.ui !== b && (this.ui = b) && (a = w.I.v(b.Fo), this.Nd.style.background = "url('spritesheet/terrain.png') -" + a.ub + "px -" + a.vb + "px", this.Vg.innerHTML = b.Eo)
};
e.eb = function() {
    this.bf = P("table", this.W, null, null);
    this.bf.style.width = "100%";
    var a = this.bf.insertRow(0),
    b = this.bf.insertRow(1),
    c = a.insertCell(0);
    c.rowSpan = 2;
    c.style.width = "50px";
    c.style.height = "50px";
    c.style.textAlign = "center";
    this.Nd = P("img", c, null, null);
    this.Nd.src = "images/Transparent.gif";
    this.Nd.style.width = "50px";
    this.Nd.style.height = "50px";
    c = a.insertCell(1);
    c.style.textAlign = "left";
    this.we = P("span", c, null, null);
    this.we.innerHTML = this.H.ib();
    c = a.insertCell(2);
    this.Cq = P("span", c, null, null);
    a = a.insertCell(3);
    a.style.width = "30px";
    a = P("div", a, null, null);
    a.style.width = "30px";
    a.style.height = "100%";
    a.style.textAlign = "left";
    a.style.background = "url('spritesheet/items.png') -1464px -73px";
    a = P("img", a, null, null);
    a.src = "images/Transparent.gif";
    a.style.width = "100%";
    a.style.height = "15px";
    this.Vg = b.insertCell(0);
    this.Vg.colSpan = 3;
    this.Vg.style.width = "200px";
    this.Vg.style.textAlign = "left"
};
function yy(a, b) {
    this.H = a;
    this.W = b;
    this.tm = this.dq = this.we = this.Vh = this.sn = this.Cq = null;
    this.sa = !1;
    this.Az = null;
    this.Lb = -1
}
e = yy.prototype;
e.Na = function() {
    return 12
};
e.J = function() {
    this.Lb = -1;
    this.tm = null
};
e.Rc = function(a) {
    this.H = a
};
e.te = function() {
    this.sn || this.eb();
    this.sa || (Rx(this.sn), this.sa = !0)
};
e.ba = function() {
    var a = this.H.Bb(),
    b = this.H.Pz(),
    c = this.H.ib(),
    d = this.H.lb();
    this.Lb !== a && (this.Lb = a, this.Cq.innerHTML = r(a));
    this.tm !== b && (this.tm = b) && (a = b.Wh, this.Vh.style.background = "url('spritesheet/items.png') -" + a.ub + "px -" + a.vb + "px");
    this.gb !== c && (this.gb = c, this.dq.innerHTML = c);
    this.Az !== d && (this.Az = d, this.we.innerHTML = this.H.lb())
};
e.eb = function() {
    this.sn = P("table", this.W, null, null);
    this.sn.style.width = "100%";
    var a = this.sn.insertRow(0),
    b = this.sn.insertRow(1),
    c = a.insertCell(0);
    c.rowSpan = 2;
    c.style.width = "30px";
    c.style.height = "30px";
    c.style.textAlign = "center";
    this.Vh = P("img", c, null, null);
    this.Vh.src = "images/Transparent.gif";
    this.Vh.style.width = "30px";
    this.Vh.style.height = "30px";
    c = a.insertCell(1);
    c.style.textAlign = "left";
    this.we = P("span", c, null, null);
    this.we.innerHTML = this.H.ib();
    c = a.insertCell(2);
    this.Cq = P("span", c, null, null);
    a = a.insertCell(3);
    a.style.width = "30px";
    a = P("div", a, null, null);
    a.style.width = "30px";
    a.style.height = "100%";
    a.style.textAlign = "left";
    a.style.background = "url('spritesheet/items.png') -1464px -73px";
    a = P("img", a, null, null);
    a.src = "images/Transparent.gif";
    a.style.width = "100%";
    a.style.height = "15px";
    this.dq = b.insertCell(0);
    this.dq.colSpan = 3;
    this.dq.style.width = "200px";
    this.dq.style.textAlign = "left"
};
function vy(a, b) {
    this.H = a;
    this.W = b;
    this.ui = this.Vg = this.we = this.Nd = this.Cm = this.Uz = null;
    this.sa = !1;
    this.Gk = -1
}
e = vy.prototype;
e.Na = function() {
    return 9
};
e.J = function() {
    this.Gk = -1
};
e.Rc = function(a) {
    this.H = a
};
e.te = function() {
    this.Cm || this.eb();
    this.sa || (Rx(this.Cm), this.sa = !0)
};
e.ba = function() {
    var a = w.Aa.Sd;
    this.Gk !== a && (this.Gk = a, this.Uz.innerHTML = "+" + r(a))
};
e.eb = function() {
    this.Cm = P("table", this.W, null, null);
    this.Cm.style.width = "100%";
    var a = this.Cm.insertRow(0),
    b = this.Cm.insertRow(1),
    c = a.insertCell(0);
    c.rowSpan = 2;
    c.style.width = "50px";
    c.style.height = "50px";
    c.style.textAlign = "center";
    this.Nd = P("img", c, null, null);
    this.Nd.src = "images/Transparent.gif";
    this.Nd.style.width = "50px";
    this.Nd.style.height = "50px";
    c = w.I.v("L2_DungeonE.PNG");
    this.Nd.style.background = "url('spritesheet/terrain.png') -" + c.ub + "px -" + c.vb + "px";
    c = a.insertCell(1);
    c.style.textAlign = "left";
    c.style.width = "150px";
    this.we = P("span", c, null, null);
    this.we.innerHTML = this.H ? this.H.ib() : "收获地牢";
    c = a.insertCell(2);
    this.Uz = P("span", c, null, null);
    a = a.insertCell(3);
    a.style.width = "30px";
    a = P("div", a, null, null);
    a.style.width = "30px";
    a.style.height = "100%";
    a.style.textAlign = "left";
    a.style.background = "url('spritesheet/terrain.png') -1302px -363px";
    a = P("img", a, null, null);
    a.src = "images/Transparent.gif";
    a.style.width = "100%";
    a.style.height = "15px";
    b = b.insertCell(0);
    b.colSpan = 3;
    b.style.textAlign = "left";
    b.innerHTML = this.H ? this.H.lb() : "收集杀戮农场"
};
function wy(a, b) {
    this.H = a;
    this.W = b;
    this.ui = this.Vg = this.we = this.Nd = this.Hm = this.Tz = null;
    this.sa = !1;
    this.Dk = -1
}
e = wy.prototype;
e.Na = function() {
    return 10
};
e.J = function() {
    this.Dk = -1
};
e.Rc = function(a) {
    this.H = a
};
e.te = function() {
    this.Hm || this.eb();
    this.sa || (Rx(this.Hm), this.sa = !0)
};
e.ba = function() {
    var a = w.ug.ni;
    this.Dk !== a && (this.Dk = a, this.Tz.innerHTML = "+" + r(a))
};
e.eb = function() {
    this.Hm = P("table", this.W, null, null);
    this.Hm.style.width = "100%";
    var a = this.Hm.insertRow(0),
    b = this.Hm.insertRow(1),
    c = a.insertCell(0);
    c.rowSpan = 2;
    c.style.width = "50px";
    c.style.height = "50px";
    c.style.textAlign = "center";
    this.Nd = P("img", c, null, null);
    this.Nd.src = "images/Transparent.gif";
    this.Nd.style.width = "50px";
    this.Nd.style.height = "50px";
    c = w.I.v("L2_Terrain077.PNG");
    this.Nd.style.background = "url('spritesheet/terrain.png') -" + c.ub + "px -" + c.vb + "px";
    c = a.insertCell(1);
    c.style.textAlign = "left";
    c.style.width = "150px";
    this.we = P("span", c, null, null);
    this.we.innerHTML = this.H ? this.H.ib() : "收集道具黄金";
    c = a.insertCell(2);
    this.Tz = P("span", c, null, null);
    a = a.insertCell(3);
    a.style.width = "30px";
    a = P("div", a, null, null);
    a.style.width = "30px";
    a.style.height = "100%";
    a.style.textAlign = "left";
    a.style.background = "url('spritesheet/items.png') -1464px -73px";
    a = P("img", a, null, null);
    a.src = "images/Transparent.gif";
    a.style.width = "100%";
    a.style.height = "15px";
    b = b.insertCell(0);
    b.colSpan = 3;
    b.style.textAlign = "left";
    b.innerHTML = this.H ? this.H.lb() : "卖掉道具得到黄金"
};
function xy(a, b) {
    this.H = a;
    this.W = b;
    this.jr = this.hr = this.gr = this.ir = this.cn = this.an = this.$m = this.bn = 0;
    this.lr = this.Sq = this.Rq = this.kr = this.sb = this.jb = this.pi = this.Zm = this.table = null;
    this.sa = !1;
    this.Lb = -1;
    this.gb = this.Bs = null;
    this.vi = -1
}
e = xy.prototype;
e.Na = function() {
    return 11
};
e.J = function() {
    this.Lb = -1;
    this.gb = this.Bs = null;
    this.vi = -1;
    this.cn = this.an = this.$m = this.bn = this.jr = this.hr = this.ir = this.gr = 0
};
e.Rc = function(a) {
    this.H = a;
    this.Lb = -1;
    this.gb = this.Bs = null;
    this.vi = -1;
    this.cn = this.an = this.$m = this.bn = this.jr = this.hr = this.ir = this.gr = 0
};
e.te = function() {
    this.table || this.eb();
    this.sa || (Rx(this.table), this.sa = !0)
};
e.ba = function() {
    var a = this.H.Bb(),
    b = this.H.ib(),
    c = this.H.Kr();
    this.Lb != a && (this.Lb = a, this.pi.innerHTML = r(a));
    this.gb != b && (this.gb = b, this.jb.innerHTML = b);
    this.vi != c && (this.vi = c, a = Math.max(1, 10 * (this.vi - 1)) + 1, this.bn = Ia(a, yi, 1), this.$m = Ia(a, zi, 1), this.an = Ia(a, Ai, 1), this.cn = Ia(a, Bi, 1), this.kr.innerHTML = r(this.bn) + " 伤害", this.Rq.innerHTML = r(this.$m) + " 护甲", this.Sq.innerHTML = r(this.an) + " 攻击", this.lr.innerHTML = r(this.cn) + " 防御", c = Th(w.ob, c), c = c[k(c.length)].ll, this.Zm.style.background = "url('spritesheet/monsters.png') -" + (c.ub + 10) + "px -" + (c.vb + 12) + "px");
    for (var d, f = 0,
    g = 0,
    h = 0,
    l = 0,
    c = vs(), a = this.H.Kr(), b = 0; b < w.i.D.length; b++) d = w.i.D[b].K,
    f += $h(d.sd),
    g += $h(d.je),
    h += $h(d.xe),
    l += $h(d.Ae);
    f = m(f / w.i.D.length);
    g = m(g / w.i.D.length);
    h = m(h / w.i.D.length);
    l = m(l / w.i.D.length);
    this.ir !== f && (this.Rq.style.color = this.$m >= f ? "#F00": "#0A0", this.ir = f);
    this.gr !== g && (this.kr.style.color = this.bn >= g ? "#F00": "#0A0", this.gr = g);
    this.hr !== h && (this.lr.style.color = this.cn >= h ? "#F00": "#0A0", this.hr = h);
    this.jr !== l && (this.Sq.style.color = this.an >= l ? "#F00": "#0A0", this.jr = l);
    b = (f > this.$m ? 1 : 0) + (g > this.bn ? 1 : 0) + (h > this.cn ? 1 : 0) + (l > this.an ? 1 : 0);
    c = c < a ? "最低角色等级需求: " + a: 4 === b ? "评定: 小菜一碟": 3 === b ? "评定: 有点挑战": 2 === b ? "评定: 非常困难!": "评定: 难如登天!";
    this.Bs !== c && (this.Bs = c, this.sb.innerHTML = c)
};
e.eb = function() {
    this.table = P("table", this.W, null, null);
    this.table.style.width = "100%";
    var a = this.table.insertRow(0),
    b = this.table.insertRow(1),
    c = this.table.insertRow(2),
    d = a.insertCell(0),
    f = a.insertCell(1),
    a = a.insertCell(2),
    b = b.insertCell(0);
    d.style.width = "190px";
    f.style.width = "40px";
    f.style.textAlign = "right";
    f.style.paddingTop = "0";
    a.style.width = "30px";
    a.style.height = "30px";
    b.style.height = "20px";
    b.colSpan = 4;
    a = P("div", a, null, null);
    a.style.width = "30px";
    a.style.height = "100%";
    a.style.textAlign = "left";
    a.style.background = "url('spritesheet/terrain.png') -1302px -363px";
    a = P("img", a, null, null);
    a.src = "images/Transparent.gif";
    a.style.width = "100%";
    a.style.height = "15px";
    this.pi = P("span", f, null, null);
    this.pi.style.width = "40px";
    this.pi.style.height = "25px";
    this.jb = P("div", d, null, null);
    this.jb.style.textAlign = "left";
    this.sb = P("div", b, null, null);
    this.sb.style.textAlign = "left";
    c = c.insertCell(0);
    c.colSpan = 3;
    c = P("table", c, null, null);
    c.style.width = "100%";
    d = c.insertRow(0);
    c = c.insertRow(1);
    f = d.insertCell(0);
    b = d.insertCell(1);
    d = d.insertCell(2);
    f.rowSpan = 2;
    f.style.width = "30px";
    f.style.height = "30px";
    b.style.width = "100px";
    b.style.textAlign = "right";
    d.style.width = "100px";
    d.style.textAlign = "right";
    this.Zm = P("img", f, null, null);
    this.Zm.className = "characterImage";
    this.Zm.src = "images/Transparent.gif";
    this.Zm.style.height = "30px";
    this.Zm.style.width = "30px";
    this.kr = P("span", b, null, null);
    this.kr.style.marginLeft = "3px";
    this.Sq = P("span", d, null, null);
    this.Sq.style.marginLeft = "15px";
    d = c.insertCell(0);
    c = c.insertCell(1);
    d.style.width = "100px";
    d.style.textAlign = "right";
    c.style.width = "100px";
    c.style.textAlign = "right";
    this.Rq = P("span", d, null, null);
    this.Rq.style.marginLeft = "3px";
    this.lr = P("span", c, null, null);
    this.lr.style.marginLeft = "15px"
};
function Ay(a, b) {
    this.H = a;
    this.W = b;
    this.sb = this.jb = null;
    this.sa = !1;
    this.gb = this.fb = null
}
e = Ay.prototype;
e.Na = function() {
    return 14
};
e.J = function() {
    this.gb = this.fb = null
};
e.Rc = function(a) {
    this.H = a
};
e.te = function() {
    this.jb || this.eb();
    this.sa || (Rx(this.jb), Rx(this.sb), this.sa = !0)
};
e.ba = function() {
    var a = this.H.ib(),
    b = this.H.lb();
    this.gb !== a && (this.gb = a, this.jb.innerHTML = a);
    this.fb !== b && (this.fb = b, this.sb.innerHTML = b)
};
e.eb = function() {
    var a = P("div", this.W, null, null);
    a.style.padding = "5px";
    a.style.color = "#FA0";
    a.style.fontWeight = "bold";
    a.innerHTML = "成就!";
    this.jb = P("div", this.W, null, null);
    this.jb.style.padding = "5px";
    this.sb = P("div", this.W, null, null);
    this.sb.style.padding = "5px"
};
function By(a, b) {
    this.H = a;
    this.W = b;
    this.sb = this.jb = null;
    this.sa = !1;
    this.gb = this.fb = null
}
e = By.prototype;
e.Na = function() {
    return 15
};
e.J = function() {
    this.gb = this.fb = null
};
e.Rc = function(a) {
    this.H = a
};
e.te = function() {
    this.jb || this.eb();
    this.sa || (Rx(this.jb), Rx(this.sb), this.sa = !0)
};
e.ba = function() {
    var a = this.H.ib(),
    b = this.H.lb();
    this.gb !== a && (this.gb = a, this.jb.innerHTML = a);
    this.fb !== b && (this.fb = b, this.sb.innerHTML = b)
};
e.eb = function() {
    this.jb = P("div", this.W, null, null);
    this.jb.style.padding = "5px";
    this.sb = P("div", this.W, null, null);
    this.sb.style.padding = "5px"
};
function Cy(a, b) {
    this.H = a;
    this.W = b;
    this.pi = this.sb = this.jb = null;
    this.sa = !1;
    this.gb = this.fb = null;
    this.Lb = -1
}
e = Cy.prototype;
e.Na = function() {
    return 16
};
e.J = function() {
    this.gb = this.fb = null;
    this.Lb = -1
};
e.Rc = function(a) {
    this.H = a
};
e.te = function() {
    this.jb || this.eb();
    this.sa || (Rx(this.jb), Rx(this.sb), Rx(this.pi), this.sa = !0)
};
e.ba = function() {
    var a = this.H.ib(),
    b = this.H.lb(),
    c = this.H.Bb();
    this.gb != a && (this.gb = a, this.jb.innerHTML = a);
    this.fb != b && (this.fb = b, this.sb.innerHTML = b);
    this.Lb != c && (this.Lb = c, this.pi.innerHTML = xa(c) + " AP")
};
e.eb = function() {
    this.jb = P("div", this.W, null, null);
    this.jb.style.padding = "5px";
    this.sb = P("div", this.W, null, null);
    this.sb.style.padding = "5px";
    this.pi = P("div", this.W, null, null);
    this.pi.style.padding = "5px"
};
function Fy(a, b, c) {
    this.F = a;
    this.Ya = !0;
    this.py = b;
    this.mj = -100;
    this.gj = [];
    var d = b.Ha;
    for (b = 0; b < d.length; b++) this.gj.push(new ky(a, d[b], b, c))
}
Fy.prototype = new Xx;
Fy.prototype.J = function() {
    Ox(this.F);
    var a;
    for (a = 0; a < this.gj.length; a++) this.gj[a].J();
    var b = this.py.Ha;
    for (a = 0; a < this.gj.length; a++) this.gj[a].Rc(b[a]);
    this.mj = -100
};
Fy.prototype.ba = function() {
    var a;
    a = this.py.mj;
    if (this.mj !== a) {
        this.mj = a;
        var b = this.py.Ha;
        for (a = 0; a < this.gj.length; a++) this.gj[a].Rc(b[a])
    }
    for (a = 0; a < this.gj.length; a++) this.gj[a].Xa()
};
function Dy(a) {
    switch (a) {
    case 1:
        return "itemRarityUncommon";
    case 2:
        return "itemRarityRare";
    case 3:
        return "itemRarityHistoric";
    case 4:
        return "itemRarityAncient"
    }
    return "itemRarityCommon"
};
function Gy() {
    this.nd = this.ee = null;
    this.vr = this.ur = this.oc = 0;
    this.pt = !1;
    this.alpha = this.am = this.$q = this.Zq = 0
}
function Hy(a) {
    a.pt = !1;
    a.ee = null;
    a.nd = null;
    a.ur = 1E5;
    a.vr = 0
}
Gy.prototype.ac = function() {
    return this.ur - this.vr
};
function Iy(a, b, c, d, f, g, h) {
    a.ee = b;
    a.ur = c;
    a.Zq = d;
    a.$q = f;
    a.am = g;
    a.alpha = h;
    a.pt = !0
}
function Jy(a, b, c, d, f, g, h, l) {
    a.nd = b;
    a.oc = c;
    a.ur = d;
    a.Zq = f;
    a.$q = g;
    a.am = h;
    a.alpha = l;
    a.pt = !0
}
Gy.prototype.If = function(a) {
    if (this.pt) {
        0 < this.alpha && (a.save(), a.globalAlpha = 0.4);
        var b;
        if (this.ee) b = this.ee.Ad.ue,
        a.drawImage(this.ee.Hj(), this.ee.ub, this.ee.vb, b, b, this.Zq, this.$q, this.am, this.am);
        else if (this.nd) {
            var c = this.nd.qq[this.oc];
            b = this.nd.Ad.ue;
            a.drawImage(this.nd.Hj(), c.qt, c.rt, b, b, this.Zq, this.$q, this.am, this.am)
        }
        0 < this.alpha && a.restore()
    }
};
function Ky() {
    this.FE = function(a, b) {
        return a.ac() - b.ac()
    };
    this.ko = new Za;
    this.Hl = [];
    this.Bn = 0;
    this.context = null
}
e = Ky.prototype;
e.hB = function(a) {
    this.context = a;
    for (a = this.Bn = 0; a < this.Hl.length; a++) Hy(this.Hl[a]);
    var b = w.iu / 2,
    c = 2 * w.Yq;
    w.wb ? (a = w.S.he + (0.5 * (b - w.Sf) + (c - w.Tf)) | 0, b = w.S.ie + (c - w.Tf - 0.5 * (b - w.Sf)) | 0) : (a = w.Ba.Ki + (0.5 * (b - w.Sf) + (c - w.Tf)) | 0, b = w.Ba.Li + (c - w.Tf - 0.5 * (b - w.Sf)) | 0);
    t(this.ko, a, b)
};
function Ly(a) {
    var b;
    a.Bn >= a.Hl.length ? (b = new Gy, a.Hl.push(b)) : b = a.Hl[a.Bn];
    a.Bn++;
    return b
}
e.dk = function(a, b, c, d, f, g, h) {
    a && (b = Jb(this.ko, b, c), Iy(Ly(this), a, b, d, f, g, h))
};
e.gx = function(a, b, c, d, f, g, h) {
    a && (b = Jb(this.ko, b, c), c = Ly(this), Iy(c, a, b, d, f, g, h), c.vr = 0.1)
};
e.fB = function(a, b, c, d, f, g, h, l) {
    a && (c = Jb(this.ko, c, d), Jy(Ly(this), a, b, c, f, g, h, l))
};
e.fx = function(a, b, c, d, f, g, h, l) {
    a && (c = Jb(this.ko, c, d), d = Ly(this), Jy(d, a, b, c, f, g, h, l), d.vr = 0.1)
};
e.hx = function() {
    2 > this.Bn || this.Hl.sort(this.FE);
    var a;
    for (a = this.Bn - 1; 0 <= a; a--) this.Hl[a].If(this.context)
};
function My() {
    this.context = null;
    this.uB = new Gy
}
e = My.prototype;
e.hB = function(a) {
    this.context = a
};
function Ny(a) {
    Hy(a.uB);
    return a.uB
}
e.dk = function(a, b, c, d, f, g, h) {
    a && (b = Ny(this), Iy(b, a, 0, d, f, g, h), b.If(this.context))
};
e.gx = function(a, b, c, d, f, g, h) {
    a && (b = Ny(this), Iy(b, a, 0, d, f, g, h), b.If(this.context))
};
e.fB = function(a, b, c, d, f, g, h, l) {
    a && (c = Ny(this), Jy(c, a, b, 0, f, g, h, l), c.If(this.context))
};
e.fx = function(a, b, c, d, f, g, h, l) {
    a && (c = Ny(this), Jy(c, a, b, 0, f, g, h, l), c.If(this.context))
};
e.hx = function() {};
function Oy(a) {
    this.context = a;
    this.se = null;
    this.uE = new Ky;
    this.DD = new My
}
Oy.prototype.If = function(a, b, c) {
    if (a) {
        var d = a.Ad.ue;
        this.context.drawImage(a.Hj(), a.ub, a.vb, d, d, b, c, d, d)
    }
};
function Py(a, b, c, d) {
    for (; c < d; c++) {
        var f = a,
        g = w.S.hb(c, b);
        if (g) {
            var h;
            h = w.vl;
            h = w.Sf + (c - h.vk - (b - h.wk)) * w.B - h.zt;
            var l;
            l = w.vl;
            l = w.Tf + (c - l.vk + (b - l.wk)) * w.Nh - l.At;
            f.If(g.Jn, h, l);
            var n = g.Yf;
            n && f.se.dk(n, g.dc(), g.ec(), h, l, n.Ad.ue, 0)
        }
    }
}
function Qy(a, b, c, d) {
    for (; c < d; c++) {
        var f = a,
        g = w.Ba.hb(c, b);
        if (g && g.Rb !== rg) {
            var h;
            h = w.vl;
            h = w.Sf + (c - h.vk - (b - h.wk)) * w.B - h.zt;
            var l;
            l = w.vl;
            l = w.Tf + (c - l.vk + (b - l.wk)) * w.Nh - l.At;
            f.If(g.Jn, h, l);
            var n = g.Yf;
            n && f.se.dk(n, g.Ob(), g.Pb(), h, l, n.Ad.ue, 0); (n = g.bt) && f.se.gx(n, g.Ob(), g.Pb(), h, l, n.Ad.ue, 0)
        }
    }
}
function Ry(a, b) {
    var c, d, f, g;
    for (g = b.length - 1; 0 <= g; g--) c = b[g],
    d = c.p.dc(),
    f = c.p.ec(),
    c = c.v(),
    a.se.dk(c, d, f, w.Sf + (d - w.S.he - (f - w.S.ie)), w.Tf + 0.5 * (d - w.S.he + (f - w.S.ie)), c.Ad.ue, 0)
}
function Sy(a, b) {
    var c, d, f, g, h, l = !1,
    n;
    for (n = b.length - 1; 0 <= n; n--) c = b[n],
    d = c.p.Ob(),
    f = c.p.Pb(),
    g = th(d, f),
    h = uh(d, f),
    l = c.Ja.wg,
    c = c.v(),
    a.se.dk(c, d, f, g, h, c.Ad.ue, l ? 0.4 : 0)
}
function Ty(a, b) {
    var c, d, f, g, h, l, n, p, s, u, y;
    for (c = 0; c < b.length; c++) if (f = b[c], !f.Va) for (y = !1, p = f.Ja.of, d = 0; d < p.length; d++) if (s = p[d], s.Pd && (s = s.hD)) u = p[d].Od,
    y || (g = f.p.Ob(), h = f.p.Pb(), l = th(g, h) + 10, n = uh(g, h) + 10, y = !0),
    a.se.fx(s, u, g, h, l, n, s.Ad.ue, 0)
}
function Uy(a) {
    var b, c, d;
    d = w.pc.al;
    if (0 !== d.length) for (a.context.font = "12px Georgia", b = 0; b < d.length; b++) c = d[b],
    a.context.fillStyle = c.SE,
    a.context.fillText(c.text, c.xt, c.yt)
}
function Vy(a, b, c, d) {
    b = b.ck;
    var f, g;
    g = w.Pe;
    var h = g.Rh,
    l = g.Sh,
    n;
    for (g = 0; g < b.length; g++) f = b[g],
    n = c * (f.Hd - h),
    f = d * (f.Id - l),
    a.context.fillRect(n, f, c, d)
}
function Wy(a, b, c) {
    var d, f, g, h, l;
    for (d = 0; d < b.length; d++) l = b[d],
    l.Va || (f = l.p.Ob(), g = l.p.Pb(), h = th(f, g), f = uh(f, g), g = l.K, l = g.Sa, g = $h(g.Jb), l === g ? (a.context.fillStyle = c, a.context.fillRect(h + 10, f + 0, 30, 4)) : (a.context.fillStyle = "white", a.context.fillRect(h + 10, f + 0, 30, 4), a.context.fillStyle = c, a.context.fillRect(h + 10, f + 0, l / g * 30 | 0, 4)))
}
function Xy() {
    var a = Math.max(2, k(5));
    return 0.5 > Math.random() ? -a: a
};
function Yy() {
    this.kE = "gameTabContent";
    this.F = "gameCanvas";
    this.gB = null
}
Yy.prototype = new Xx;
Yy.prototype.J = function() {
    this.pf()
};
Yy.prototype.ba = function() {
    var a = this.gB;
    a.se = w.Nb.rq ? a.uE: a.DD;
    a.se.hB(a.context);
    if (w.S.ty) if (a.context.fillStyle = "#000000", a.context.fillRect(0, 0, w.iu, w.Yq), w.wb) {
        var b = w.S.bc(w.S.he),
        c = w.S.cc(w.S.ie) - 18;
        Py(a, c++, b - 5, b - 3);
        Py(a, c++, b - 6, b - 2);
        Py(a, c++, b - 7, b - 1);
        Py(a, c++, b - 8, b);
        Py(a, c++, b - 9, b + 1);
        Py(a, c++, b - 10, b + 2);
        Py(a, c++, b - 11, b + 3);
        Py(a, c++, b - 12, b + 4);
        Py(a, c++, b - 13, b + 5);
        Py(a, c++, b - 14, b + 6);
        Py(a, c++, b - 15, b + 7);
        Py(a, c++, b - 16, b + 8);
        Py(a, c++, b - 17, b + 9);
        Py(a, c++, b - 18, b + 10);
        Py(a, c++, b - 19, b + 11);
        Py(a, c++, b - 20, b + 12);
        Py(a, c++, b - 19, b + 13);
        Py(a, c++, b - 18, b + 14);
        Py(a, c++, b - 17, b + 15);
        Py(a, c++, b - 16, b + 16);
        Py(a, c++, b - 14, b + 16);
        Py(a, c++, b - 13, b + 16);
        Py(a, c++, b - 12, b + 15);
        Py(a, c++, b - 11, b + 14);
        Py(a, c++, b - 10, b + 13);
        Py(a, c++, b - 9, b + 12);
        Py(a, c++, b - 8, b + 11);
        Py(a, c++, b - 7, b + 10);
        Py(a, c++, b - 6, b + 9);
        Py(a, c++, b - 5, b + 8);
        Py(a, c++, b - 4, b + 7);
        Py(a, c++, b - 3, b + 6);
        Py(a, c++, b - 2, b + 5);
        Py(a, c++, b - 1, b + 4);
        Py(a, c, b, b + 3);
        Ry(a, w.Ni.eh);
        Ry(a, w.i.D);
        w.Nb.Mm && Uy(a);
        a.se.hx();
        if (w.Nb.up) {
            var d = w.Pe,
            f = d.Rh,
            g = d.Sh,
            h = 120 / (d.Rh + d.Eh - f) | 0,
            l = 120 / (d.Sh + d.Eh - g) | 0;
            a.context.save();
            a.context.translate(650, 280);
            a.context.rotate(Math.PI / 4);
            var n = w.ob.fc,
            p = w.kb.pd,
            s, u;
            a.context.fillStyle = "gray";
            for (u = 0; u < p.length; u++) s = p[u],
            s.$b && Vy(a, s, h, l);
            a.context.fillStyle = "green";
            for (u = 0; u < p.length; u++) s = p[u],
            s.cb && Vy(a, s, h, l);
            a.context.fillStyle = "#AA8800";
            for (u = 0; u < p.length; u++) s = p[u],
            s.ye && Vy(a, s, h, l);
            a.context.fillStyle = "#885500";
            for (u = 0; u < p.length; u++) s = p[u],
            Jc(s) && n >= s.Jf && Vy(a, s, h, l);
            a.context.fillStyle = "#AA3300";
            for (u = 0; u < p.length; u++) s = p[u],
            Jc(s) && n < s.Jf && Vy(a, s, h, l);
            a.context.fillStyle = "white";
            for (u = 0; u < p.length; u++) s = p[u],
            Jc(s) || s.$b || s.ye || s.cb || Vy(a, s, h, l);
            var y = w.S.q[1][1],
            A = h * (y.Hd - f),
            C = l * (y.Id - g);
            a.context.fillStyle = "blue";
            a.context.fillRect(A + 2, C + 2, 4, 4);
            a.context.restore()
        }
    } else {
        var v = w.Ba.Ai(w.Ba.Ki),
        D = w.Ba.Bi(w.Ba.Li) - 18;
        Qy(a, D++, v - 5, v - 3);
        Qy(a, D++, v - 6, v - 2);
        Qy(a, D++, v - 7, v - 1);
        Qy(a, D++, v - 8, v);
        Qy(a, D++, v - 9, v + 1);
        Qy(a, D++, v - 10, v + 2);
        Qy(a, D++, v - 11, v + 3);
        Qy(a, D++, v - 12, v + 4);
        Qy(a, D++, v - 13, v + 5);
        Qy(a, D++, v - 14, v + 6);
        Qy(a, D++, v - 15, v + 7);
        Qy(a, D++, v - 16, v + 8);
        Qy(a, D++, v - 17, v + 9);
        Qy(a, D++, v - 18, v + 10);
        Qy(a, D++, v - 19, v + 11);
        Qy(a, D++, v - 20, v + 12);
        Qy(a, D++, v - 19, v + 13);
        Qy(a, D++, v - 18, v + 14);
        Qy(a, D++, v - 17, v + 15);
        Qy(a, D++, v - 16, v + 16);
        Qy(a, D++, v - 14, v + 16);
        Qy(a, D++, v - 13, v + 16);
        Qy(a, D++, v - 12, v + 15);
        Qy(a, D++, v - 11, v + 14);
        Qy(a, D++, v - 10, v + 13);
        Qy(a, D++, v - 9, v + 12);
        Qy(a, D++, v - 8, v + 11);
        Qy(a, D++, v - 7, v + 10);
        Qy(a, D++, v - 6, v + 9);
        Qy(a, D++, v - 5, v + 8);
        Qy(a, D++, v - 4, v + 7);
        Qy(a, D++, v - 3, v + 6);
        Qy(a, D++, v - 2, v + 5);
        Qy(a, D++, v - 1, v + 4);
        Qy(a, D, v, v + 3);
        var N = w.ff.pe,
        I, x, z, O, J, la;
        for (la = 0; la < N.length; la++) {
            I = N[la];
            x = I.Xo;
            z = I.Yo;
            O = Zy(x, z);
            J = $y(x, z);
            var Q = I.Xl,
            V = w.ff;
            a.If(100 > Q ? V.Sz: 1E3 > Q ? V.xw: V.wD, O, J)
        }
        var na = w.Uh.kf,
        K, H, S, da, W, ia;
        for (ia = 0; ia < na.length; ia++) K = na[ia],
        H = K.bq,
        S = K.cq,
        da = Zy(H, S),
        W = $y(H, S),
        a.If(Bq(K.vf()), da, W);
        var ea = w.Ti.Hf,
        va, yb, Fb, pa, T, X;
        for (X = 0; X < ea.length; X++) va = ea[X],
        yb = va.Qp,
        Fb = va.Rp,
        pa = Zy(yb, Fb),
        T = $y(yb, Fb),
        a.If(va.hc.jc, pa, T);
        var Ca = w.dh.yf,
        qa, ta, eb, Gb, Da, ub;
        for (ub = 0; ub < Ca.length; ub++) qa = Ca[ub],
        ta = qa.mp,
        eb = qa.np,
        Gb = Zy(ta, eb),
        Da = $y(ta, eb),
        a.If(qa.getItem().Uk(), Gb, Da);
        var mb = w.th.Mn,
        Ea, La, wa, Fa, ha, ja, Ga;
        for (ja = 0; ja < mb.length; ja++) Ea = mb[ja],
        Ea.Nn.Xi && (La = Ea.zq, wa = Ea.Aq, Fa = Zy(La, wa), ha = $y(La, wa), Ga = Ea.Kg ? Ea.PA: Ea.Vy, Ea.BC.jh ? a.se.gx(Ga, La, wa, Fa, ha, Ga.Ad.ue, 0) : a.se.dk(Ga, La, wa, Fa, ha, Ga.Ad.ue, 0));
        var bb = w.Gf.Og,
        za, nb, fb, cb, Ua, Va;
        for (Va = 0; Va < bb.length; Va++) za = bb[Va],
        nb = za.p.Ob(),
        fb = za.p.Pb(),
        cb = Zy(nb, fb),
        Ua = $y(nb, fb),
        a.If(za.v(), cb, Ua);
        var mc = xh(),
        vb,
        Sb,
        Ma,
        zb,
        Hb,
        ac = w.B / 2 | 0,
        ob,
        pb;
        for (ob = 0; ob < mc.length; ob++) vb = mc[ob],
        Sb = vb.p.Ob(),
        Ma = vb.p.Pb(),
        zb = th(Sb, Ma),
        Hb = uh(Sb, Ma),
        pb = vb.v(),
        4 === vb.zb ? a.se.dk(pb, Sb, Ma, zb - ac, Hb - ac, 3 * w.B, 0) : a.se.dk(pb, Sb, Ma, zb, Hb, pb.Ad.ue, 0);
        Sy(a, w.Ni.eh);
        Sy(a, w.i.D);
        Ty(a, xh());
        Ty(a, w.Ni.eh);
        Ty(a, w.i.D);
        if (w.Nb.nq) {
            var Ha = w.df.Wg;
            if (Ha && 0 !== Ha.length) {
                var jb, Ab, Bb, qb, wb, Ib, Ec, bc, Wa, cc, Qa = null,
                nc = !1;
                for (jb = 0; jb < Ha.length; jb++) if (Wa = Ha[jb], cc = Wa.Io, 1 === cc) Ab = Wa.Zg(),
                Bb = Wa.wm,
                bc = Wa.oc,
                qb = Bb.T,
                wb = Bb.U,
                Ib = th(qb, wb) + 10,
                Ec = uh(qb, wb) + 10,
                a.se.fx(Ab, bc, qb, wb, Ib, Ec, Ab.Ad.ue, 0);
                else if (2 === cc) {
                    var sa = a,
                    Tb = Wa,
                    qc = void 0,
                    Fc = void 0,
                    Cb = void 0,
                    kb = void 0,
                    Ra = void 0,
                    Ja = void 0,
                    Db = void 0,
                    gb = void 0,
                    rb = void 0,
                    dc = void 0;
                    sa.context.lineWidth = 1;
                    sa.context.strokeStyle = "#FFD700";
                    Ja = Tb.iD;
                    Db = Ja.T;
                    gb = Ja.U;
                    rb = th(Db, gb) + w.B;
                    dc = uh(Db, gb) + w.B;
                    qc = Tb.xi;
                    Fc = qc.T;
                    Cb = qc.U;
                    kb = th(Fc, Cb) + w.B;
                    Ra = uh(Fc, Cb) + w.B;
                    sa.context.beginPath();
                    sa.context.moveTo(rb, dc);
                    var Ka = void 0,
                    Xa = void 0,
                    Ka = rb + (kb - rb) / 3 | 0,
                    Xa = dc + (Ra - dc) / 3 | 0,
                    Ka = Ka + Xy(),
                    Xa = Xa + Xy();
                    sa.context.lineTo(Ka, Xa);
                    Ka = Ka + (kb - Ka) / 2 | 0;
                    Xa = Xa + (Ra - Xa) / 2 | 0;
                    Ka += Xy();
                    Xa += Xy();
                    sa.context.lineTo(Ka, Xa);
                    sa.context.lineTo(kb, Ra);
                    sa.context.stroke()
                } else cc === Yb && (Qa = Wa.ew, nc = !0);
                if (nc && Qa) {
                    var hb, lb, rc, sc = Qa.ia,
                    Aa = Qa.ja,
                    db = sc + Qa.rb,
                    Mc = Aa + Qa.qb,
                    ec, Ub, sb, ka, Eb, xb, Na;
                    for (xb = sc; xb <= db; xb++) for (Na = Aa; Na <= Mc; Na++)(ec = w.Ba.hb(xb, Na)) && (hb = ec.Pq) && hb.Cj && !hb.bl() && (lb = hb.Zg(), rc = hb.oc, Ub = ec.Ob(), sb = ec.Pb(), ka = th(Ub, sb) + 10, Eb = uh(Ub, sb) + 10, a.se.fB(lb, rc, Ub, sb, ka, Eb, lb.Ad.ue, 0))
                }
            }
        }
        a.se.hx();
        Wy(a, xh(), "red");
        w.i.Xg.ym || (Wy(a, w.Ni.eh, "#007FFF"), Wy(a, w.i.D, "#8B008B"));
        w.Nb.Mm && Uy(a)
    }
    w.Nb.Po && (a.context.font = "12px Georgia", a.context.fillStyle = "white", a.context.fillText("帧数: " + w.i.dz, 10, 20))
};
Yy.prototype.pf = function() {
    var a = M(this.kE);
    if (a) {
        var b = this.F,
        c = M(b);
        c || (c = P("canvas", a, b, "gameTabTopLeftPanel"), c.width = w.iu, c.height = w.Yq, c.innerHTML = "你的浏览器不支持Html5.请升级你的浏览器.");
        this.gB = new Oy(c.getContext("2d"));
        this.Ya = !0
    }
};
function az(a) {
    this.F = "gameTabAdventurerInfo" + a;
    this.Ya = !0;
    this.$ = a;
    this.Nq = null;
    this.Wl = ["adventurerEffectIconA" + a, "adventurerEffectIconB" + a, "adventurerEffectIconC" + a, "adventurerEffectIconD" + a, "adventurerEffectIconE" + a, "adventurerEffectIconF" + a];
    this.Ay = "adventurerHealthSlider" + a;
    this.zy = "adventurerHealth" + a;
    this.Lq = "adventurerDamage" + a;
    this.Jq = "adventurerArmor" + a;
    this.Kq = "adventurerAR" + a;
    this.Mq = "adventurerDR" + a;
    this.By = "adventurerLevelClass" + a;
    this.Dy = "adventurerSpiritPowerSlider" + a;
    this.Cy = "adventurerSpiritPower" + a;
    this.nn = this.Ak = this.pk = this.ok = this.zk = null;
    this.uv = this.sv = this.rv = this.tv = this.$f = this.rr = this.pr = this.or = this.qr = this.mv = this.Jk = this.kv = this.av = -1;
    this.qm = [null, null, null, null, null, null];
    this.lk = [null, null, null, null, null, null];
    this.Dm = [0, 0, 0, 0, 0, 0];
    this.qw = 8;
    this.De = 0;
    this.vj = -1;
    this.Oq = !1
}
az.prototype = new Xx;
az.prototype.J = function() {
    Ox(this.F);
    this.Nq = null;
    this.Oq = !1;
    this.nn = null;
    if (0 > this.$ || this.$ >= w.i.D.length) this.$ >= 4 + Rs.t ? (this.nn = P("div", M(this.F), null, "gameTabLockedAdventurerInfo"), P("span", this.nn, null, "lockedSpanText").innerHTML = "未解锁", this.Oq = !0) : this.nn = P("div", M(this.F), null, "gameTabBlankAdventurerInfo");
    else {
        this.vj = this.rr = this.pr = this.or = this.qr = this.mv = this.Jk = this.kv = this.av = this.$f = -1;
        var a;
        for (a = 0; a < this.qm.length; a++) this.qm[a] = null,
        this.lk[a] = null,
        this.Dm[a] = 0;
        this.Nq = P("table", M(this.F), null, "adventurerInfoTable");
        a = this.Nq.insertRow(0);
        var b = a.insertCell(0);
        b.className = "gameTabAdventurerIconCell";
        b.rowSpan = 2;
        var c = w.i.D[this.$],
        d = c.v(),
        b = P("img", b, null, "characterImage");
        b.src = "images/Transparent.gif";
        b.style.height = "35px";
        b.style.background = "url('spritesheet/monsters.png') -" + d.ub + "px -" + (d.vb + 8) + "px";
        d = a.insertCell(1);
        d.style.width = "123px";
        d.innerHTML = c.Xt;
        c = a.insertCell(2);
        c.className = "gameTabAdventurerSliderCell";
        c.title = "生命值";
        d = P("div", c, null, null);
        d.className = "gameTabAdventurerSliderDiv";
        P("div", d, this.Ay, "gameTabAdventurerHealthSlider");
        P("div", c, this.zy, "gameTabAdventurerSliderOverlay");
        c = a.insertCell(3);
        c.style.width = "30px";
        c.style.textAlign = "left";
        c.style.paddingLeft = "4px";
        c.title = "生命值";
        c.innerHTML = "HP";
        c = a.insertCell(4);
        c.id = this.Lq;
        c.title = "伤害:提高攻击伤害";
        c.className = "gameTabAdventurerInfoHpAc";
        this.zk = a.insertCell(5);
        this.zk.style.width = "30px";
        this.zk.style.textAlign = "left";
        this.zk.title = "伤害:提高攻击伤害";
        this.zk.innerHTML = "伤害";
        c = a.insertCell(6);
        c.id = this.Kq;
        c.className = "gameTabAdventurerInfoHpAc";
        c.title = "攻击率：增加成功攻击的机会，可以理解为命中属性";
        this.pk = a.insertCell(7);
        this.pk.style.width = "30px";
        this.pk.style.textAlign = "left";
        this.pk.title = "攻击率：增加成功攻击的机会，可以理解为命中属性";
        this.pk.innerHTML = "攻击";
        d = 8;
        for (c = 0; c < this.Wl.length; c++) b = a.insertCell(d++),
        b.rowSpan = 2,
        b = P("div", b, null, "gameTabAdventurerInfoEffect"),
        b = P("img", b, this.Wl[c], "itemImage"),
        b.src = "images/Transparent.gif",
        b.style.width = "30px",
        b.style.height = "30px",
        b.style.display = "none";
        a = this.Nq.insertRow(1);
        c = a.insertCell(0);
        c.id = this.By;
        c.style.width = "120px";
        c = a.insertCell(1);
        c.className = "gameTabAdventurerSliderCell";
        c.title = "法力值";
        d = P("div", c, null, "gameTabAdventurerSliderDiv");
        P("div", d, this.Dy, "gameTabAdventurerSpiritPointsSlider");
        P("div", c, this.Cy, "gameTabAdventurerSliderOverlay");
        c = a.insertCell(2);
        c.style.width = "30px";
        c.style.textAlign = "left";
        c.style.paddingLeft = "4px";
        c.title = "法力值";
        c.innerHTML = "SP";
        c = a.insertCell(3);
        c.id = this.Jq;
        c.className = "gameTabAdventurerInfoHpAc";
        c.title = "护甲:降低受到的伤害";
        this.ok = a.insertCell(4);
        this.ok.style.width = "30px";
        this.ok.style.textAlign = "left";
        this.ok.title = "护甲:降低受到的伤害";
        this.ok.innerHTML = "护甲";
        c = a.insertCell(5);
        c.id = this.Mq;
        c.className = "gameTabAdventurerInfoHpAc";
        c.title = "防御率：防止敌人成功攻击，可以理解为闪避属性";
        this.Ak = a.insertCell(6);
        this.Ak.style.width = "30px";
        this.Ak.style.textAlign = "left";
        this.Ak.title = "防御率：防止敌人成功攻击，可以理解为闪避属性";
        this.Ak.innerHTML = "防御"
    }
};
az.prototype.ba = function() {
    if (! (0 > this.$)) if (this.$ >= w.i.D.length) this.Oq && this.$ < 4 + Rs.t && (this.Oq = !1, this.nn.className = "gameTabBlankAdventurerInfo", Px(this.nn));
    else {
        var a = w.i.D[this.$],
        b = a.K,
        c = b.Sa,
        d = $h(b.Jb),
        f = b.Yc,
        g = $h(b.Ke),
        h = $h(b.sd),
        l = $h(b.je),
        n = $h(b.xe),
        p = $h(b.Ae),
        b = b.Eb;
        if (this.av !== c || this.kv !== d) {
            Ux(this.zy, r(c) + "/" + r(d));
            var s = Math.min(100, m(100 * c / d));
            M(this.Ay).style.width = s + "%";
            this.av = c;
            this.kv = d
        }
        if (this.Jk !== f || this.mv !== g) Ux(this.Cy, r(f) + "/" + r(g)),
        c = Math.min(100, m(100 * f / g)),
        M(this.Dy).style.width = c + "%",
        this.Jk = f,
        this.mv = g;
        this.$f !== b && (this.$f = b, Ux(this.By, "等级" + b + " " + w.i.D[this.$].Kc.Ka));
        this.qr !== h && Ux(this.Lq, r(h));
        this.or !== l && Ux(this.Jq, r(l));
        this.pr !== n && Ux(this.Kq, r(n));
        this.rr !== p && Ux(this.Mq, r(p));
        c = a.Ja.of;
        f = !1;
        this.De++;
        this.De >= this.qw && (this.De = 0, f = !0);
        for (a = 0; a < this.lk.length; a++) this.lk[a] = null;
        for (a = d = 0; a < c.length; a++) g = c[a].X,
        b = this.lk.indexOf(g),
        0 > b && d < this.lk.length && (this.lk[d] = g, d++);
        for (a = 0; a < this.qm.length; a++)(g = a < this.lk.length ? this.lk[a] : null, c = this.qm[a], g) ? c && c === g ? f && (g = Li[c], c = g.Te, d = w.Dj.Zg(g.vd), this.Dm[a]++, this.Dm[a] >= d.To() && (this.Dm[a] = 0), d = d.qq[this.Dm[a]], b = M(this.Wl[a]), b.style.background = "url('" + c + "') -" + d.qt + "px -" + d.rt + "px") : (c = g, this.qm[a] = c, g = Li[c], c = g.Te, d = w.Dj.Zg(g.vd), this.Dm[a] = 0, d = d.qq[0], b = M(this.Wl[a]), b.style.background = "url('" + c + "') -" + d.qt + "px -" + d.rt + "px", b.title = g.cf, Tx(this.Wl[a])) : c && (Sx(this.Wl[a]), this.qm[a] = null);
        a = xh();
        0 === a.length ? -1 < this.vj && (M(this.Lq).style.color = "#FFF", M(this.Jq).style.color = "#FFF", M(this.Kq).style.color = "#FFF", M(this.Mq).style.color = "#FFF", this.zk.style.color = "#FFF", this.ok.style.color = "#FFF", this.pk.style.color = "#FFF", this.Ak.style.color = "#FFF", this.uv = this.sv = this.tv = this.rv = this.vj = -1) : (c = a[0].K, a = $h(c.sd), f = $h(c.je), g = $h(c.xe), c = $h(c.Ae), this.vj = w.i.Xg.Ar, bz(this.Lq, h, f, this.qr, this.rv, this.zk), bz(this.Jq, l, a, this.or, this.tv, this.ok), bz(this.Kq, n, c, this.pr, this.uv, this.pk), bz(this.Mq, p, g, this.rr, this.sv, this.Ak), this.rv = f, this.tv = a, this.sv = g, this.uv = c);
        this.qr = h;
        this.or = l;
        this.pr = n;
        this.rr = p
    }
};
function bz(a, b, c, d, f, g) {
    if (b != d || c != f) b < c ? (M(a).style.color = "#F00", g.style.color = "#F00") : b > c ? (M(a).style.color = "#0A0", g.style.color = "#0A0") : (M(a).style.color = "#FFF", g.style.color = "#FFF")
};
function cz() {
    this.F = "dungeonNotificationPanel";
    this.Ya = !1;
    this.Eo = "";
    this.nl = null;
    this.Su = this.Bk = ""
}
cz.prototype = new Xx;
cz.prototype.J = function() {
    Ox(this.F);
    this.Su = this.Bk = "";
    var a = M(this.F);
    this.nl = P("div", a, null, "dungeonNotificationDiv");
    Qx(a);
    this.Vw = !1
};
cz.prototype.Pm = function() {
    return ! w.wb
};
cz.prototype.ba = function() {
    var a, b;
    w.Mc ? (a = w.Mc.Eo, b = w.Mc.ri + 1) : (a = w.le.mi, b = 0);
    if (b !== this.Su || a !== this.Bk) this.Su = b,
    this.Bk = a,
    this.nl.innerHTML = 0 < b ? a + " (等级." + b + ")": a
};
function dz() {
    this.F = "encounterNotificationPanel";
    this.Ya = !1;
    this.nl = null;
    this.bA = this.xz = this.vj = -1;
    this.Bz = !1
}
dz.prototype = new Xx;
dz.prototype.J = function() {
    this.nl || (this.nl = P("div", M(this.F), null, "encounterNotificationDiv"))
};
dz.prototype.Pm = function() {
    return ! w.i.Xg.ym
};
dz.prototype.ba = function() {
    var a = w.i.Xg.Ar,
    b = xh().length;
    if (this.vj !== a || this.xz != b) {
        this.vj !== a && (this.bA = b);
        this.vj = a;
        this.xz = b;
        var c;
        c = w.i.Xg.fw;
        a = w.i.Xg.du;
        this.nl.innerHTML = a ? "遭遇首领!<br/> " + c: "一场遭遇战!<br/>" + b + "/" + this.bA + " " + c;
        this.Bz != a && (this.Bz = a, this.nl.className = a ? "bossEncounterNotificationDiv": "encounterNotificationDiv")
    }
};
function ez() {
    this.F = "currencyPanel";
    this.Ya = !0;
    this.pD = "expCell";
    this.tD = "goldAmountCell";
    this.Hw = "killsCountCell";
    this.rm = this.vz = this.uz = -1
}
ez.prototype = new Xx;
ez.prototype.J = function() {};
ez.prototype.ba = function() {
    var a = w.i.da.cg,
    b = w.i.da.fd,
    c = w.i.da.Je;
    a !== this.uz && (this.uz = a, Ux(this.pD, "" + r(a)));
    b !== this.vz && (this.vz = b, Ux(this.tD, "" + r(b)));
    c !== this.rm && (this.rm = c, Ux(this.Hw, "" + r(c)))
};
function fz(a) {
    this.F = a;
    this.Ya = !0;
    this.Np = null;
    this.qz = -1
}
fz.prototype = new Xx;
fz.prototype.J = function() {
    Ox(this.F);
    gz(this)
};
fz.prototype.ba = function() {
    this.Np || gz(this);
    var a = w.i.ae.Dd;
    a !== this.qz && (this.qz = a, this.Np.innerHTML = xa(a))
};
function gz(a) {
    var b = P("table", M(a.F), null, null);
    b.style.width = "100%";
    b = b.insertRow(0);
    a.Np = b.insertCell(0);
    b = b.insertCell(1);
    a.Np.style.textAlign = "right";
    a.Np.style.paddingTop = "5px";
    b.style.width = "30px";
    b.style.paddingTop = "5px";
    b.style.textAlign = "left";
    b.title = "冒险点数";
    b.innerHTML = "AP"
};
function hz(a) {
    this.Gw = {};
    this.qp = [];
    var b, c, d;
    for (b = 0; b < a.length; b++) for (d = a[b], c = 0; c < d.length; c++) this.qp.push(d[c]);
    iz(this);
    jz(this)
}
function jz(a) {
    document.onkeyup = function(b) {
        a.Gw[b.keyCode] = !0
    }
}
function iz(a) {
    var b;
    for (b = 0; b < a.qp.length; b++) a.Gw[a.qp[b]] = !1
};
function kz(a, b, c, d) {
    this.F = a;
    this.Ya = !0;
    this.Vh = this.Cx = this.mx = this.$p = this.tm = this.scroll = null;
    this.aq = !1;
    this.Gv = !this.aq;
    this.rz = -1;
    this.yz = null;
    this.wz = !0;
    this.YC = b;
    this.Qr = c;
    this.qp = d
}
kz.prototype = new Xx;
kz.prototype.J = function() {};
kz.prototype.ba = function() {
    this.$p || lz(this);
    var a = !1;
    if (this.scroll != this.tm && (this.tm = this.scroll, a = !0, this.scroll)) {
        var b = this.scroll.Wh;
        this.Vh.style.background = "url('spritesheet/items.png') -" + b.ub + "px -" + b.vb + "px"
    }
    b = this.scroll.rg;
    this.yz !== b && (this.yz = b, this.mx.innerHTML = b);
    b = this.scroll ? this.scroll.mh: -1;
    cr.t && (b = -2);
    var c = 0 < b || cr.t;
    this.aq = !this.scroll.Qe && c && !w.wb && 0 < xh().length;
    if (a || this.Gv != this.aq) this.Gv = this.aq,
    this.$p.className = this.aq ? "scrollButton": "scrollButtonDisabled";
    a = this.scroll.Qe;
    if (this.rz !== b || this.wz != a) this.rz = b,
    this.wz = a,
    this.Cx.innerHTML = a ? "": cr.t ? "无限": "x" + b;
    a: {
        a = this.qp;
        for (b = 0; b < a.length; b++) if (this.Qr.Gw[a[b]]) {
            a = !0;
            break a
        }
        a = !1
    }
    a && mz(this)
};
function mz(a) {
    a.scroll && (0 < a.scroll.mh || cr.t) && (nz(a.YC), Hq(a.scroll, cr.t))
}
function lz(a) {
    a.$p = P("div", M(a.F), null, "scrollButtonDisabled");
    a.Gv = !1;
    var b = P("table", a.$p, null, null),
    c = b.insertRow(0),
    b = b.insertRow(1),
    d = c.insertCell(0);
    d.rowSpan = 2;
    a.mx = c.insertCell(1);
    a.Cx = b.insertCell(0);
    a.mx.style.textAlign = "left";
    a.Cx.style.textAlign = "left";
    a.Vh = P("img", d, null, "itemImage");
    a.Vh.style.height = "30px";
    a.Vh.src = "images/Transparent.gif";
    a.$p.onmouseup = function() {
        mz(a);
        return ! 1
    }
};
function oz() {
    this.F = "scrollButtonContainer";
    this.Ya = !0;
    this.fu = null;
    this.Zs = [];
    this.oA = [[49, 35, 97], [50, 40, 98], [51, 34, 99], [52, 37, 100], [53, 12, 101], [54, 39, 102]];
    this.Qr = new hz(this.oA)
}
oz.prototype = new Xx;
oz.prototype.J = function() {
    Ox(this.F);
    this.Zs.length = 0;
    this.so()
};
oz.prototype.ba = function() {
    this.fu || this.so();
    var a, b = w.nh.at,
    c, d;
    for (a = 0; a < this.Zs.length; a++) d = b.length > a ? b[a] : null,
    c = this.Zs[a],
    c.scroll = d,
    c.Xa();
    iz(this.Qr)
};
oz.prototype.so = function() {
    this.fu = P("table", M(this.F), null, null);
    var a = this.fu.insertRow(0),
    b,
    c,
    d;
    for (d = 0; 6 > d; d++) c = a.insertCell(d),
    b = "scrollButtonCell" + d,
    P("div", c, b, null),
    this.Zs.push(new kz(b, d, this.Qr, this.oA[d]))
};
function pz(a, b) {
    this.F = a;
    this.Ya = !0;
    this.hc = null;
    this.TA = b;
    this.yo = this.sm = null;
    this.gu = 192;
    this.Pp = this.Op = this.Tp = this.yj = this.Si = this.pb = this.km = null;
    this.ak = !1;
    this.Jh = -1;
    this.Sp = this.Bo = !1
}
pz.prototype = new Xx;
pz.prototype.J = function() {
    Ox(this.F);
    this.Pp = this.Op = this.Tp = this.yj = this.Si = this.pb = this.km = this.yo = this.sm = this.hc = null;
    this.ak = this.Sp = !1
};
pz.prototype.ba = function() {
    this.Si || qz(this);
    this.Sp && this.TA < sr + tr.t && (this.Sp = !1, this.Si.className = "potionButtonDisabled");
    if (this.hc) {
        this.sm || Rx(this.Si);
        var a;
        a = (a = this.hc) ? !a.Oe && Wq(a) ? "potionButtonDisabled": a.Oe ? "potionButtonActive": "potionButton": "potionButtonDisabled";
        this.yo != a && (this.yo = a, this.Si.className = a);
        this.hc != this.sm && (this.Tp.innerHTML = this.hc.uc, this.Op.innerHTML = this.hc.tc, a = this.hc.jc, this.Pp.style.background = "url('spritesheet/items.png') -" + a.ub + "px -" + a.vb + "px");
        this.sm = this.hc;
        this.hc.Oe ? (this.ak || (Rx(this.pb), this.ak = !0), a = Math.min(1, (w.i.$a - this.hc.Vl) / (800 + Ts.t)), a *= this.gu, this.Jh !== a && (this.Jh = a, this.pb.style.width = a + "px")) : this.ak && (Qx(this.pb), this.ak = !1);
        this.Bo || (this.Bo = !0, this.yj.style.display = "block")
    } else this.sm && (this.sm = null, this.Tp.innerHTML = "", this.Op.innerHTML = "", this.Pp.style.background = "", this.Bo && (this.Bo = !1, this.yj.style.display = "none"), this.ak && (Qx(this.pb), this.ak = !1), this.yo = "potionButtonDisabled", this.Si.className = this.yo)
};
pz.prototype.aw = function() {
    this.hc && (this.hc.Oe || !this.hc.Oe && Wq(this.hc) || this.hc.aw())
};
pz.prototype.bw = function() {
    this.hc && (w.Yj.bw(this.hc), this.hc = null)
};
function qz(a) {
    a.km = P("div", M(a.F), null, "potionContentContainer");
    a.Sp = a.TA >= sr + tr.t;
    a.Si = P("table", a.km, null, a.Sp ? "potionButtonLocked": "potionButtonDisabled");
    var b = a.Si.insertRow(0),
    c = a.Si.insertRow(1),
    d = b.insertCell(0);
    d.rowSpan = 2;
    a.Tp = b.insertCell(1);
    a.Op = c.insertCell(0);
    a.Tp.style.textAlign = "left";
    a.Op.style.textAlign = "left";
    a.Pp = P("img", d, null, "itemImage");
    a.Pp.src = "images/Transparent.gif";
    a.km.onmouseup = function() {
        a.aw();
        return ! 1
    };
    a.pb = P("div", a.km, null, "potionButtonProgressSlider");
    a.ak = !1;
    a.yj = P("div", a.km, null, "dropPotionButton");
    a.yj.title = "丢弃药剂";
    a.yj.innerHTML = "X";
    a.yj.style.display = "none";
    a.Bo = !1;
    a.yj.onmouseup = function() {
        a.bw();
        return ! 1
    }
};
function rz() {
    this.F = "potionButtonContainer";
    this.Ya = !0;
    this.su = !1;
    this.Ms = []
}
rz.prototype = new Xx;
rz.prototype.J = function() {
    Ox(this.F);
    this.Ms.length = 0;
    this.su = !1;
    this.so()
};
rz.prototype.ba = function() {
    this.su || this.so();
    var a, b = w.Yj.re,
    c, d;
    for (a = 0; a < this.Ms.length; a++) d = a < b.length ? b[a] : null,
    c = this.Ms[a],
    c.hc = d,
    c.Xa()
};
rz.prototype.so = function() {
    var a = M(this.F);
    this.su = !0;
    var b, c, d = 0;
    for (b = 0; 4 > b; b++) for (c = 0; 2 > c; c++) {
        var f = c,
        g = b,
        h = d++,
        l = "potionButton_Row" + g + "_Col" + f,
        n = P("div", a, null, "potionCellDiv");
        n.id = l;
        n.style.left = 196 * f + "px";
        n.style.top = 47 * g + "px";
        this.Ms.push(new pz(l, h))
    }
};
function sz(a) {
    this.F = "gameTabContent";
    this.C = a;
    R(this, new Yy);
    R(this, new cz);
    R(this, new dz);
    R(this, new ez);
    R(this, new fz("adventurePointsPanel"));
    R(this, new Fy("upgradeButtonContainer", Mx, !1));
    R(this, new tz);
    R(this, new oz);
    R(this, new rz);
    R(this, new az(0));
    R(this, new az(1));
    R(this, new az(2));
    R(this, new az(3));
    R(this, new az(4))
}
sz.prototype = new jy;
sz.prototype.Me = function() {
    this.C.qa = !1;
    this.C.ha = !1
};
sz.prototype.Ne = function() {
    this.C.qa = !0;
    this.C.ha = !0
};
sz.prototype.Zd = function() {
    this.C.qa = !1;
    this.C.ha = !1
};
sz.prototype.J = function() {
    this.C.qa = !0;
    this.C.ha = !0;
    Zx(this)
};
function uz() {
    this.F = "infoTabSaveLoadContainer";
    this.Ya = !0;
    this.SD = "lastSaveDiv";
    this.tr = -1;
    M("saveButton").onclick = function() {
        w.iE();
        return ! 1
    };
    M("firstResetButton").onclick = function() {
        Tx("resetConfirmContainer");
        Sx("firstResetButtonContainer");
        return ! 1
    };
    M("realResetButton").onclick = function() {
        w.OA();
        Sx("resetConfirmContainer");
        Tx("firstResetButtonContainer");
        return ! 1
    };
    M("cancelResetButton").onclick = function() {
        Sx("resetConfirmContainer");
        Tx("firstResetButtonContainer");
        return ! 1
    };
    M("firstDeleteButton").onclick = function() {
        Tx("deleteSaveConfirmContainer");
        Sx("firstDeleteSaveButtonContainer");
        return ! 1
    };
    M("realDeleteButton").onclick = function() {
        w.gE();
        Sx("deleteSaveConfirmContainer");
        Tx("firstDeleteSaveButtonContainer");
        return ! 1
    };
    M("cancelDeleteButton").onclick = function() {
        Sx("deleteSaveConfirmContainer");
        Tx("firstDeleteSaveButtonContainer");
        return ! 1
    };
    M("exportSaveButton").onclick = function() {
        var a = M("exportSaveInput");
        a.value = vz(w.pg);
        Tx("exportSaveContainer");
        Sx("exportSaveButton");
        a.select();
        return ! 1
    };
    M("cancelExportButton").onclick = function() {
        Sx("exportSaveContainer");
        Tx("exportSaveButton");
        M("exportSaveInput").value = "";
        return ! 1
    };
    M("importSaveButton").onclick = function() {
        Sx("importErrorMessage");
        Sx("importSuccessMessage");
        M("importSaveInput").value = "";
        Tx("importSaveContainer");
        Sx("importSaveButton");
        return ! 1
    };
    M("importOkButton").onclick = function() {
        w.hE(M("importSaveInput").value) ? (Sx("importErrorMessage"), Tx("importSuccessMessage")) : (Tx("importErrorMessage"), Sx("importSuccessMessage"));
        return ! 1
    };
    M("importCloseButton").onclick = function() {
        Sx("importErrorMessage");
        Sx("importSuccessMessage");
        M("importSaveInput").value = "";
        Sx("importSaveContainer");
        Tx("importSaveButton");
        return ! 1
    }
}
uz.prototype = new Xx;
uz.prototype.J = function() {
    this.tr = -1
};
uz.prototype.ba = function() {
    var a;
    a = w.pg.qs;
    this.tr !== a && 0 < a && (this.tr = a, Ux(this.SD, "最后保存于: " + (new Date(this.tr)).toLocaleTimeString()))
};
function wz(a) {
    this.F = "infoTabContent";
    this.C = a;
    R(this, new uz);
    R(this, new xz);
    R(this, new yz)
}
wz.prototype = new jy;
wz.prototype.Me = function() {
    this.C.ha = !1;
    this.C.qa = !0
};
wz.prototype.Ne = function() {
    this.C.qa = !0;
    this.C.ha = !1
};
wz.prototype.Zd = function() {
    this.C.qa = !1;
    this.C.ha = !1
};
wz.prototype.J = function() {
    this.C.qa = !0;
    this.C.ha = !1;
    Zx(this)
};
function xz() {
    this.F = "statisticsContainer";
    this.Ya = !0;
    this.st = null;
    this.Jx = this.Au = this.Ux = this.bv = this.fy = this.Cv = this.my = this.Yv = this.Vx = this.Ek = this.Wx = this.Fk = this.iy = this.Iv = this.dy = this.Av = this.jy = this.Nv = this.ey = this.Bv = this.Yx = this.nv = this.Mx = this.Ku = this.Qx = this.Tu = this.Zx = this.Ik = this.hy = this.Hv = this.Nx = this.Qu = this.Sx = this.Xu = this.Tx = this.Yu = this.Kx = this.Eu = this.ny = this.$v = this.ky = this.Wv = this.$x = this.qv = this.Rx = this.Uu = this.Lx = this.Hu = this.Px = this.Ck = this.Xx = this.Hk = this.gy = this.Ev = this.Ox = this.Ru = this.ly = this.Xv = this.cy = this.by = this.ay = this.yv = this.xv = this.wv = this.Zv = -1;
    this.UB = this.Fy = this.eC = this.Vz = this.oC = this.eB = this.wC = this.DC = this.fC = this.Tm = this.gC = this.Um = this.rC = this.nB = this.mC = this.UA = this.sC = this.BB = this.nC = this.dB = this.iC = this.zA = this.tC = this.aj = this.aC = this.Iz = this.jC = this.Ap = this.qC = this.lB = this.YB = this.mz = this.cC = this.Qz = this.dC = this.Rz = this.VB = this.Ky = this.yC = this.LC = this.uC = this.AC = this.kC = this.GA = this.bC = this.Jz = this.WB = this.Oy = this.$B = this.vm = this.hC = this.Vm = this.ZB = this.Dz = this.pC = this.jB = this.vC = this.CC = this.SA = this.lC = this.xC = null;
    this.AA = 36E5
}
xz.prototype = new Xx;
e = xz.prototype;
e.J = function() {
    this.Jx = this.Au = this.Ux = this.bv = this.fy = this.Cv = this.my = this.Yv = this.Vx = this.Ek = this.Wx = this.Fk = this.iy = this.Iv = this.dy = this.Av = this.jy = this.Nv = this.ey = this.Bv = this.Yx = this.nv = this.Mx = this.Ku = this.Qx = this.Tu = this.Zx = this.Ik = this.hy = this.Hv = this.Nx = this.Qu = this.Sx = this.Xu = this.Tx = this.Yu = this.Kx = this.Eu = this.ny = this.$v = this.ky = this.Wv = this.$x = this.qv = this.Rx = this.Uu = this.Lx = this.Hu = this.Px = this.Ck = this.Xx = this.Hk = this.Ox = this.Ru = this.gy = this.Ev = this.ly = this.Xv = this.cy = this.by = this.ay = this.yv = this.xv = this.wv = this.Zv = -1;
    this.fr()
};
e.ba = function() {
    this.st || this.fr();
    var a = w.i.Ih,
    b = w.i.Ua,
    c = w.i.wh,
    d = b.Xj,
    f = a.Xj,
    g = b.On,
    h = a.On,
    l = b.qn,
    n = a.qn,
    p = b.Lk,
    s = a.Lk,
    u = b.Mj,
    y = a.Mj,
    A = b.wi,
    C = a.wi,
    v = b.uk,
    D = a.uk,
    N = b.Rk,
    I = a.Rk,
    x = b.kl,
    z = a.kl,
    O = b.Nl,
    J = a.Nl,
    la = b.Sl,
    Q = a.Sl,
    V = b.tk,
    na = a.tk,
    K = b.Xk,
    H = a.Xk,
    S = b.Wk,
    da = a.Wk,
    W = b.si,
    ia = a.si,
    ea = b.Dl,
    va = a.Dl,
    yb = b.Ff,
    Fb = a.Ff,
    pa = b.Sd,
    T = a.Sd,
    X = b.oj,
    Ca = a.oj,
    qa = b.hl,
    ta = a.hl,
    eb = b.wl,
    Gb = a.wl,
    Da = b.Gl,
    ub = a.Gl,
    mb = b.ul,
    Ea = a.ul,
    La = b.El,
    wa = a.El,
    Fa = b.Ph,
    ha = a.Ph,
    ja = b.Gi,
    Ga = a.Gi,
    bb = b.Ol,
    za = a.Ol,
    nb = b.xl,
    fb = a.xl,
    cb = b.Zk,
    Ua = a.Zk,
    b = b.nk,
    a = a.nk;
    this.Zv != c && (this.Zv = c, this.xC.innerHTML = r(c));
    this.Xv != h && (this.Xv = h, this.CC.innerHTML = r(h));
    this.ly != g && (this.ly = g, this.vC.innerHTML = r(g));
    this.Ev != n && (this.Ev = n, this.jB.innerHTML = r(n));
    this.gy != l && (this.gy = l, this.pC.innerHTML = r(l));
    this.Ru != s && (this.Ru = s, this.Dz.innerHTML = r(s));
    this.Ox != p && (this.Ox = p, this.ZB.innerHTML = r(p));
    this.Hk != y && (this.Hk = y, this.Vm.innerHTML = r(y));
    this.Xx != u && (this.Xx = u, this.hC.innerHTML = r(u));
    this.Ck != C && (this.Ck = C, this.vm.innerHTML = r(C));
    this.Px != A && (this.Px = A, this.$B.innerHTML = r(A));
    this.Hu != D && (this.Hu = D, this.Oy.innerHTML = r(D) + "/" + w.kb.pd.length);
    this.Lx != v && (this.Lx = v, this.WB.innerHTML = r(v));
    this.Uu != I && (this.Uu = I, this.Jz.innerHTML = r(I));
    this.Rx != N && (this.Rx = N, this.bC.innerHTML = r(N));
    this.qv != z && (this.qv = z, this.GA.innerHTML = r(z));
    this.$x != x && (this.$x = x, this.kC.innerHTML = r(x));
    this.Wv != J && (this.Wv = J, this.AC.innerHTML = r(J));
    this.ky != O && (this.ky = O, this.uC.innerHTML = r(O));
    this.$v != Q && (this.$v = Q, this.LC.innerHTML = r(Q));
    this.ny != la && (this.ny = la, this.yC.innerHTML = r(la));
    this.Eu != na && (this.Eu = na, this.Ky.innerHTML = r(na));
    this.Kx != V && (this.Kx = V, this.VB.innerHTML = r(V));
    this.Yu != H && (this.Yu = H, this.Rz.innerHTML = r(H));
    this.Tx != K && (this.Tx = K, this.dC.innerHTML = r(K));
    this.Xu != da && (this.Xu = da, this.Qz.innerHTML = r(da));
    this.Sx != S && (this.Sx = S, this.cC.innerHTML = r(S));
    this.Qu != ia && (this.Qu = ia, this.mz.innerHTML = r(ia));
    this.Nx != W && (this.Nx = W, this.YB.innerHTML = r(W));
    this.Hv != va && (this.Hv = va, this.lB.innerHTML = r(va));
    this.hy != ea && (this.hy = ea, this.qC.innerHTML = r(ea));
    this.Ik != Fb && (this.Ik = Fb, this.Ap.innerHTML = r(Fb));
    this.Zx != yb && (this.Zx = yb, this.jC.innerHTML = r(yb));
    this.Tu != T && (this.Tu = T, this.Iz.innerHTML = r(T));
    this.Qx != pa && (this.Qx = pa, this.aC.innerHTML = r(pa));
    this.Ku != Ca && (this.Ku = Ca, this.aj.innerHTML = r(Ca));
    this.Mx != X && (this.Mx = X, this.tC.innerHTML = r(X));
    this.nv != ta && (this.nv = ta, this.zA.innerHTML = r(ta));
    this.Yx != qa && (this.Yx = qa, this.iC.innerHTML = r(qa));
    this.Bv != Gb && (this.Bv = Gb, this.dB.innerHTML = r(Gb));
    this.ey != eb && (this.ey = eb, this.nC.innerHTML = r(eb));
    this.Nv != ub && (this.Nv = ub, this.BB.innerHTML = r(ub));
    this.jy != Da && (this.jy = Da, this.sC.innerHTML = r(Da));
    this.Av != Ea && (this.Av = Ea, this.UA.innerHTML = r(Ea));
    this.dy != mb && (this.dy = mb, this.mC.innerHTML = r(mb));
    this.Iv != wa && (this.Iv = wa, this.nB.innerHTML = r(wa));
    this.iy != La && (this.iy = La, this.rC.innerHTML = r(La));
    this.Fk != ha && (this.Fk = ha, this.Um.innerHTML = r(ha));
    this.Wx != Fa && (this.Wx = Fa, this.gC.innerHTML = r(Fa));
    this.Ek != Ga && (this.Ek = Ga, this.Tm.innerHTML = r(Ga));
    this.Vx != ja && (this.Vx = ja, this.fC.innerHTML = r(ja));
    this.Yv != za && (this.Yv = za, this.DC.innerHTML = r(za));
    this.my != bb && (this.my = bb, this.wC.innerHTML = r(bb));
    this.Cv != fb && (this.Cv = fb, this.eB.innerHTML = r(fb));
    this.fy != nb && (this.fy = nb, this.oC.innerHTML = r(nb));
    this.bv != Ua && (this.bv = Ua, this.Vz.innerHTML = r(Ua));
    this.Ux != cb && (this.Ux = cb, this.eC.innerHTML = r(cb));
    this.Au != a && (this.Au = a, this.Fy.innerHTML = r(a));
    this.Jx != b && (this.Jx = b, this.UB.innerHTML = r(b));
    c = m(d / this.AA);
    g = m(d / 6E4 % 60);
    d = m(d / 1E3 % 60);
    h = m(f / this.AA);
    l = m(f / 6E4 % 60);
    f = m(f / 1E3 % 60);
    if (this.ay != c || this.by != g || this.cy != d) this.ay = c,
    this.by = g,
    this.cy = d,
    this.lC.innerHTML = this.Er(c, g, d);
    if (this.wv != h || this.xv != l || this.yv != f) this.wv = h,
    this.xv = l,
    this.yv = f,
    this.SA.innerHTML = this.Er(h, l, f)
};
e.Er = function(a, b, c) {
    return (10 > a ? "0": "") + a + ":" + (10 > b ? "0": "") + b + ":" + (10 > c ? "0": "") + c
};
e.fr = function() {
    Ox(this.F);
    var a = M(this.F);
    P("div", a, null, "sectionTitle").innerHTML = "统计";
    this.st = P("table", a, null, "statisticsTable");
    a = 0;
    this.St(a++);
    var b = a++,
    b = zz(this, "游戏胜利:", b);
    this.V(b, 1).innerHTML = "无";
    this.xC = this.V(b, 2);
    b = a++;
    b = zz(this, "游戏时间:", b);
    this.SA = this.V(b, 1);
    this.lC = this.V(b, 2);
    b = a++;
    b = zz(this, "游戏回合:", b);
    this.CC = this.V(b, 1);
    this.vC = this.V(b, 2);
    b = a++;
    b = zz(this, "打开大门:", b);
    this.Dz = this.V(b, 1);
    this.ZB = this.V(b, 2);
    b = a++;
    b = zz(this, "清理房间:", b);
    this.jB = this.V(b, 1);
    this.pC = this.V(b, 2);
    b = a++;
    b = zz(this, "清理管卡:", b);
    this.Vm = this.V(b, 1);
    this.hC = this.V(b, 2);
    b = a++;
    b = zz(this, "清理地牢:", b);
    this.vm = this.V(b, 1);
    this.$B = this.V(b, 2);
    b = a++;
    b = zz(this, "征服城堡:", b);
    this.Oy = this.V(b, 1);
    this.WB = this.V(b, 2);
    b = a++;
    b = zz(this, "购买农场:", b);
    this.Jz = this.V(b, 1);
    this.bC = this.V(b, 2);
    b = a++;
    b = zz(this, "召唤宠物:", b);
    this.GA = this.V(b, 1);
    this.kC = this.V(b, 2);
    b = a++;
    b = zz(this, "财宝箱:", b);
    this.AC = this.V(b, 1);
    this.uC = this.V(b, 2);
    b = a++;
    b = zz(this, "武器架:", b);
    this.LC = this.V(b, 1);
    this.yC = this.V(b, 2);
    b = a++;
    b = zz(this, "书架:", b);
    this.Ky = this.V(b, 1);
    this.VB = this.V(b, 2);
    b = a++;
    b = zz(this, "怪物黄金:", b);
    this.Rz = this.V(b, 1);
    this.dC = this.V(b, 2);
    b = a++;
    b = zz(this, "道具黄金:", b);
    this.Qz = this.V(b, 1);
    this.cC = this.V(b, 2);
    b = a++;
    b = zz(this, "直接杀死:", b);
    this.mz = this.V(b, 1);
    this.YB = this.V(b, 2);
    b = a++;
    b = zz(this, "卷轴杀死:", b);
    this.lB = this.V(b, 1);
    this.qC = this.V(b, 2);
    b = a++;
    b = zz(this, "宠物杀死:", b);
    this.Ap = this.V(b, 1);
    this.jC = this.V(b, 2);
    b = a++;
    b = zz(this, "农场杀戮:", b);
    this.Iz = this.V(b, 1);
    this.aC = this.V(b, 2);
    b = a++;
    b = zz(this, "昏迷次数:", b);
    this.aj = this.V(b, 1);
    this.tC = this.V(b, 2);
    b = a++;
    b = zz(this, "近战攻击:", b);
    this.zA = this.V(b, 1);
    this.iC = this.V(b, 2);
    b = a++;
    b = zz(this, "远程攻击:", b);
    this.dB = this.V(b, 1);
    this.nC = this.V(b, 2);
    b = a++;
    b = zz(this, "施放法术:", b);
    this.BB = this.V(b, 1);
    this.sC = this.V(b, 2);
    b = a++;
    b = zz(this, "使用药剂:", b);
    this.UA = this.V(b, 1);
    this.mC = this.V(b, 2);
    b = a++;
    b = zz(this, "使用卷轴:", b);
    this.nB = this.V(b, 1);
    this.rC = this.V(b, 2);
    b = a++;
    b = zz(this, "卖出道具:", b);
    this.Um = this.V(b, 1);
    this.gC = this.V(b, 2);
    b = a++;
    b = zz(this, "找到道具:", b);
    this.Tm = this.V(b, 1);
    this.fC = this.V(b, 2);
    b = a++;
    b = zz(this, "罕见道具:", b);
    this.DC = this.V(b, 1);
    this.wC = this.V(b, 2);
    b = a++;
    b = zz(this, "稀有道具:", b);
    this.eB = this.V(b, 1);
    this.oC = this.V(b, 2);
    b = a++;
    b = zz(this, "历史道具:", b);
    this.Vz = this.V(b, 1);
    this.eC = this.V(b, 2);
    a = zz(this, "远古道具:", a);
    this.Fy = this.V(a, 1);
    this.UB = this.V(a, 2)
};
e.St = function(a) {
    a = this.st.insertRow(a);
    Vx(a).innerHTML = "";
    var b = Vx(a);
    b.style.textAlign = "right";
    b.innerHTML = "当前";
    a = Vx(a);
    a.style.textAlign = "right";
    a.innerHTML = "总计"
};
function zz(a, b, c) {
    a = a.st.insertRow(c);
    c = a.insertCell(0);
    c.className = "statisticsTableLabel";
    c.innerHTML = b;
    return a
}
e.V = function(a, b) {
    var c = a.insertCell(b);
    c.style.textAlign = "right";
    c.style.width = "70px";
    return c
};
function yz() {
    this.F = "gameOptionsContainer";
    this.Ya = !0;
    this.tA = !1
}
yz.prototype = new Xx;
yz.prototype.J = function() {
    var a = M("infoTextEnabledCheckbox"),
    b = M("spellEffectsEnabledCheckbox"),
    c = M("mapOverlayEnabledCheckbox"),
    d = M("offlineProcessingEnabledCheckbox"),
    f = M("inactiveTabProcessingEnabledCheckbox"),
    g = M("spriteRenderOrderEnabledCheckbox"),
    h = M("fpsVisibleCheckbox");
    a.checked = w.Nb.Mm;
    b.checked = w.Nb.nq;
    c.checked = w.Nb.up;
    d.checked = w.Nb.Jp;
    f.checked = w.Nb.bp;
    g.checked = w.Nb.rq;
    h.checked = w.Nb.Po;
    this.tA || (a.addEventListener("change",
    function() {
        w.Nb.Mm = a.checked
    }), b.addEventListener("change",
    function() {
        w.Nb.nq = b.checked
    }), c.addEventListener("change",
    function() {
        w.Nb.up = c.checked
    }), d.addEventListener("change",
    function() {
        w.Nb.Jp = d.checked
    }), f.addEventListener("change",
    function() {
        w.Nb.bp = f.checked
    }), g.addEventListener("change",
    function() {
        w.Nb.rq = g.checked
    }), h.addEventListener("change",
    function() {
        w.Nb.Po = h.checked
    }), this.tA = !0)
};
function Az(a) {
    this.F = "partyCreationTabContent";
    this.C = a;
    this.Vb = [];
    this.cr = [];
    this.Ww = !1;
    this.rx = null;
    this.tz = this.zr = this.jm = !1;
    this.$i = this.oo = null;
    this.ql = !1
}
Az.prototype = new jy;
e = Az.prototype;
e.Me = function() {
    this.C.qa = !1;
    this.C.ha = !1
};
e.Ne = function() {
    this.C.qa = !1;
    this.C.ha = !1
};
e.Zd = function() {
    this.C.qa = !1;
    this.C.ha = !1
};
e.J = function() {
    this.C.qa = !1;
    Ox(this.F);
    this.ql = !1;
    this.Vb.length = 0;
    this.cr.length = 0;
    this.Ww = !1;
    this.$i = null
};
e.ba = function() {
    if (! (0 < w.i.D.length)) {
        this.ql || (Bz(this), this.ql = !0);
        if (this.jm) {
            this.jm = !1;
            var a = this.rx;
            if (a) for (; 0 < a.rows.length;) a.deleteRow(0);
            var b = null,
            a = 0,
            c;
            for (c = 0; c < this.Vb.length; c++) b = this.rx.insertRow(a),
            a++,
            b = b.insertCell(0),
            Cz(this, b, this.Vb[c], c)
        }
        this.tz != this.zr && ((this.tz = this.zr) ? Rx(this.oo) : Qx(this.oo))
    }
};
function Bz(a) {
    var b = M(a.F);
    Px(b);
    Dz(b);
    Ez(a, b);
    Fz(a, b);
    b = P("div", b, null, "partyConfirmationPanel");
    a.$i = P("div", b, "startQuestButton", "disabledUpgradeButton");
    a.$i.style.padding = "15px";
    a.$i.style.textAlign = "center";
    a.$i.innerHTML = Gz();
    a.$i.onclick = function() {
        if (! (1 > a.Vb.length) && a.Ww) {
            var b = a.Vb,
            d, f, g, h = "";
            for (d = 0; d < b.length; d++) {
                f = b[d].Qy;
                f = av[f];
                g = b[d].za;
                var l = f.d;
                g = new Uh(g, bt, f.pa, f, new Zv);
                var n = g.K;
                g.ee = w.fh.v(l);
                l = hi(f.nb());
                g.Fh = l;
                n.Tq = 12;
                n.Pr = 2;
                n.ot = 3;
                n.Eb = 1;
                l = Math.min(40, w.i.wh);
                if (0 < l) {
                    var p = g;
                    p.de = l;
                    p.Zi = ws(p)
                }
                f.fe && (g.Ci = 1);
                xs();
                for (var l = g.Z,
                s = p = void 0,
                s = 0; s < l.length; s++)(p = Nv(w.Sm, l[s], g, 1, 0)) && g.Qk(p);
                ji(n, 1, f.Ma);
                f = g;
                w.i.D.push(f);
                0 < d && (h += ", ");
                h += f.Kc.Ka
            }
            w.i.gg = w.i.D[0];
            w.i.ce = Hz();
            w.lg = !0;
            cg();
            cd();
            Iz();
            w.$h.J();
            w.Ee.J();
            Ta("Party Creation", h)
        }
    }
}
function Dz(a) {
    a = P("div", a, "partyCreationHeader", "partyCreationIntroductionPanel");
    var b = P("div", a, null, "sectionTitle");
    b.style.fontSize = "14px";
    b.innerHTML = "末日大陆需要你的力量!";
    b = P("p", a, null, null);
    b.style.fontSize = "13px";
    b.innerHTML = "所有地牢,被遗忘的神庙,封禁的高塔,黑暗矿洞,拷问室,和幽闭的洞穴,那些曾经一片美好的地方,环境优美宜人,都陷入怪物的蹂躏之下,你要做的只有杀戮.";
    a = P("p", a, null, null);
    a.style.fontSize = "13px";
    a.innerHTML = "只有你有这个能力让一切回归旧貌,选择你的队友,杀光大陆上所有的怪物."
}
function Gz() {
    var a = 4 + Rs.t;
    if (4 === a) return "最多选择4名队员";
    if (5 === a) return "最多选择5名队员"
}
function Ez(a, b) {
    var c = P("div", b, null, "partySelectionHeaderContainer");
    P("span", c, null, "partySelectionHeaderSpan").innerHTML = Gz();
    var c = P("div", b, null, "partySelectionPanel"),
    c = P("table", c, null, "partySelectionTable"),
    d = null,
    f = 0,
    g,
    h;
    for (h = 0; h < av.length; h++) if (d = c.insertRow(f), f++, g = d.insertCell(0), d = w.i.wh < av[h].Le) {
        var d = a,
        l = h;
        g = P("table", g, null, "lockedCharacterSelectionTable").insertRow(0).insertCell(0);
        var n = w.fh.v(av[l].d),
        p = P("img", g, null, "characterImage");
        p.src = "images/Transparent.gif";
        p.style.height = "35px";
        p.style.width = "35px";
        p.style.background = "url('spritesheet/monsters.png') -" + (n.ub + 10) + "px -" + (n.vb + 12) + "px";
        g = P("div", g, null, null);
        n = void 0;
        switch (av[l].Le) {
        case 0:
            n = "角色已经解锁了(bug?)";
            break;
        case 1:
            n = "二周目时解锁该角色";
            break;
        case 2:
            n = "三周目时解锁该角色";
            break;
        case 3:
            n = "四周目时解锁该角色";
            break;
        case 4:
            n = "五周目时解锁该角色";
            break;
        case 5:
            n = "六周目时解锁该角色";
            break;
        case 6:
            n = "七周目时解锁该角色";
            break;
        default:
            n = "稍后解锁该角色"
        }
        g.innerHTML = n;
        d.cr.push(null)
    } else Jz(a, g, h)
}
function Fz(a, b) {
    var c = P("div", b, null, "selectedCharactersHeaderContainer");
    P("span", c, null, "partySelectionHeaderSpan").innerHTML = "已选择角色";
    c = P("div", b, null, "selectedCharactersPanel");
    a.rx = P("table", c, null, "partySelectionTable");
    a.oo = P("div", c, null, "partySelectionNameWarning");
    a.oo.innerHTML = "给你的角色取个独特的名字.";
    a.oo.style.display = "none"
}
function Jz(a, b, c) {
    var d = av[c],
    f,
    g,
    h;
    b = P("table", b, null, "characterSelectionButton");
    a.cr.push(b);
    b.onclick = function() {
        a.Vb.length >= 4 + Rs.t || (a.Vb.push({
            Qy: c,
            za: av[c].za
        }), a.jm = !0, Kz(a))
    };
    f = b.insertRow(0);
    b = b.insertRow(1);
    g = f.insertCell(0);
    g.style.width = "35px";
    g.style.textAlign = "center";
    h = w.fh.v(d.d);
    g = P("img", g, null, "characterImage");
    g.src = "images/Transparent.gif";
    g.style.height = "35px";
    g.style.width = "35px";
    g.style.background = "url('spritesheet/monsters.png') -" + (h.ub + 10) + "px -" + (h.vb + 12) + "px";
    f = f.insertCell(1);
    f.style.width = "410px";
    f.style.textAlign = "left";
    f = P("span", f, null, null);
    f.style.fontWeight = "bold";
    f.style.fontSize = "13px";
    f.innerHTML = d.Ka;
    b = b.insertCell(0);
    b.colSpan = 2;
    b.innerHTML = d.yb
}
function Cz(a, b, c, d) {
    var f = av[c.Qy],
    g,
    h,
    l,
    n,
    p,
    s;
    b = P("div", b, null, "selectedCharacterContainer");
    g = P("table", b, null, "selectedCharacterSelectionTable");
    c.za && "" !== c.za || (g.className = "errorSelectedCharacterSelectionTable");
    h = g.insertRow(0);
    l = g.insertRow(1);
    n = h.insertCell(0);
    n.style.width = "35px";
    n.style.textAlign = "center";
    p = w.fh.v(f.d);
    n = P("img", n, null, "characterImage");
    n.src = "images/Transparent.gif";
    n.style.height = "35px";
    n.style.width = "35px";
    n.style.background = "url('spritesheet/monsters.png') -" + (p.ub + 10) + "px -" + (p.vb + 12) + "px";
    h = h.insertCell(1);
    h.style.width = "400px";
    h.style.textAlign = "left";
    s = P("input", h, null, null);
    s.type = "text";
    s.size = 15;
    s.maxLength = 15;
    s.value = c.za;
    s.onkeyup = function() {
        Lz(a, c, s.value, g)
    };
    s.onchange = function() {
        Lz(a, c, s.value, g)
    };
    h = P("span", h, null, null);
    h.style.fontWeight = "bold";
    h.style.fontSize = "13px";
    h.style.marginLeft = "5px";
    h.innerHTML = " " + f.Ka;
    l = l.insertCell(0);
    l.colSpan = 2;
    l.innerHTML = f.yb;
    f = P("div", b, null, "deselectCharacterButton");
    f.title = "移除角色";
    f.innerHTML = "X";
    f.onmouseup = function() {
        0 > d || d >= a.Vb.length || (a.Vb.splice(d, 1), a.jm = !0, Kz(a));
        return ! 1
    };
    f = 0 < d;
    l = P("div", b, null, f ? "moveUpButton": "disabledMoveUpButton");
    l.title = "上移";
    l.innerHTML = "&#9650";
    f && (l.onmouseup = function() {
        if (0 !== d) {
            var b = a.Vb[d - 1];
            a.Vb[d - 1] = a.Vb[d];
            a.Vb[d] = b;
            a.jm = !0;
            Kz(a)
        }
        return ! 1
    });
    f = d < a.Vb.length - 1;
    b = P("div", b, null, f ? "moveDownButton": "disabledMoveDownButton");
    b.title = "下移";
    b.innerHTML = "&#9660;";
    f && (b.onmouseup = function() {
        if (! (d >= a.Vb.length - 1)) {
            var b = a.Vb[d + 1];
            a.Vb[d + 1] = a.Vb[d];
            a.Vb[d] = b;
            a.jm = !0;
            Kz(a)
        }
        return ! 1
    })
}
function Lz(a, b, c, d) {
    var f = null != b.za && "" != b.za;
    c ? (c = c.replace("&", "&amp;"), c = c.replace("<", "&lt;"), c = c.replace(">", "&gt;"), c = c.replace('"', "&quot;"), c = c.replace("'", "&#x27;"), c = c.replace("/", "&#x2F;")) : c = "";
    b.za = c;
    b = null != b.za && "" != b.za;
    f && !b ? d.className = "errorSelectedCharacterSelectionTable": !f && b && (d.className = "selectedCharacterSelectionTable");
    Kz(a)
}
function Kz(a) {
    var b = !0,
    c, d, f = 4 + Rs.t,
    g = [],
    h = !1;
    for (d = 0; d < a.Vb.length; d++)(c = a.Vb[d].za) && "" !== c || (b = !1),
    -1 < g.indexOf(c) && (h = !0, b = !1),
    g.push(c);
    for (d = 0; d < av.length; d++) c = w.i.wh < av[d].Le,
    c || (a.cr[d].className = a.Vb.length === f ? "disabledCharacterSelectionButton": "characterSelectionButton");
    0 === a.Vb.length && (b = !1);
    d = f - a.Vb.length;
    f = Gz();
    if (b) switch (a.$i.className = "upgradeButton", d) {
    case 1:
        f = "你还可以添加1个角色,或是直接开始游戏.";
        break;
    case 2:
        f = "你还可以添加2个角色,或是直接开始游戏.";
        break;
    case 3:
        f = "你还可以添加3个角色,或是直接开始游戏.";
        break;
    case 4:
        f = "你还可以添加4个角色,或是直接开始游戏.";
        break;
    default:
        f = "开始冒险!"
    } else a.$i.className = "disabledUpgradeButton";
    a.$i.innerHTML = f;
    a.zr = h;
    a.Ww = b
};
function Mz() {}
Mz.prototype.J = function() {};
function Nz(a, b) {
    this.lh = a;
    this.$ = b;
    this.Ej = this.Cr = this.gf = this.Oh = this.Af = this.Ie = this.Fi = this.Ei = this.item = null;
    this.qi()
}
Nz.prototype = new Mz;
e = Nz.prototype;
e.Xa = function() {};
e.Ne = function() {};
e.Zd = function() {};
e.ux = function(a) {
    if (this.item = a) {
        var b = this.item.Uk();
        this.Ei.style.background = "url('spritesheet/items.png') -" + b.ub + "px -" + b.vb + "px";
        this.Fi.innerHTML = Lv(this.item);
        this.Ie.innerHTML = Kv(this.item);
        this.Af.innerHTML = this.item.ns + "";
        this.gf.innerHTML = r(this.item.zf);
        this.Oh.innerHTML = r(this.item.va) + " " + Jv(this.item);
        var c = w.i.D[this.$],
        b = c.ef(a.r);
        this.Oh.className = b ? this.item.va > b.va ? "itemValueBetter": this.item.va < b.va ? "itemValueWorse": "": "itemValueBetter";
        this.gf.className = b ? a.zf > b.zf ? "itemValueBetter": a.zf < b.zf ? "itemValueWorse": "": "itemValueBetter";
        this.Ie.className = Dy(this.item.uf()); ! b || this.item.va > b.va ? (this.Ej.style.display = "block", this.Ej.onclick = function() {
            c.Qk(a);
            return ! 1
        }) : this.Ej.style.display = "none"
    } else this.Ei.style.background = "",
    this.Fi.innerHTML = "",
    this.Ie.innerHTML = "",
    this.Af.innerHTML = "",
    this.Oh.innerHTML = "",
    this.gf.className = "",
    this.Ej.style.display = "none",
    this.Ej.onclick = null,
    this.Ie.className = ""
};
e.qi = function() {
    var a = this.lh,
    b = a.insertCell(0);
    b.style.width = "50px";
    b.style.padding = "0";
    b.style.textAlign = "center";
    this.Ei = P("img", b, null, "itemImage");
    this.Ei.src = "images/Transparent.gif";
    this.Fi = a.insertCell(1);
    this.Fi.style.width = "250px";
    this.Ie = a.insertCell(2);
    this.Ie.style.width = "110px";
    this.Ie.style.textAlign = "center";
    this.Af = a.insertCell(3);
    this.Af.style.textAlign = "right";
    this.Af.style.paddingRight = "5px";
    this.Af.style.width = "60px";
    this.Oh = a.insertCell(4);
    this.Oh.style.width = "120px";
    this.gf = a.insertCell(5);
    this.gf.style.textAlign = "right";
    this.gf.style.paddingRight = "5px";
    this.gf.style.width = "70px";
    this.Cr = a.insertCell(6);
    this.Cr.style.width = "100px";
    this.Ej = P("div", this.Cr, null, "equipButtonDiv");
    this.Ej.innerHTML = "装备";
    this.Ej.style.display = "none"
};
function Oz(a, b) {
    this.F = a;
    this.Ya = !0;
    this.$ = b;
    this.Jj = null;
    this.bh = []
}
Oz.prototype = new Xx;
e = Oz.prototype;
e.J = function() {
    this.bh.length = 0;
    Ox(this.F);
    this.Jj = null
};
e.ba = function() {
    if (! (0 > this.$ || this.$ >= w.i.D.length)) {
        this.Jj || this.pf();
        var a = w.i.D[this.$].Ld.items;
        a.length !== this.bh.length && this.mk(a.length);
        var b;
        for (b = 0; b < this.bh.length; b++) a[b] !== this.bh[b].item && this.bh[b].ux(a[b])
    }
};
e.mk = function(a) {
    for (; this.bh.length > a;) this.Jj.deleteRow( - 1),
    this.bh.splice(this.bh.length - 1, 1);
    for (; this.bh.length < a;) this.bh.push(new Nz(this.Jj.insertRow(this.bh.length + 1), this.$))
};
e.pf = function() {
    var a = this.F;
    Ox(a);
    this.Jj = P("table", M(a), null, "monsterTable");
    this.Ri(this.Jj.insertRow(0))
};
e.Ri = function(a) {
    var b = Vx(a);
    b.style.textAlign = "center";
    b.style.padding = "0";
    b.innerHTML = "图标";
    Vx(a).innerHTML = "道具名称";
    b = Vx(a);
    b.style.textAlign = "center";
    b.innerHTML = "稀有度";
    b = Vx(a);
    b.style.textAlign = "right";
    b.style.paddingRight = "5px";
    b.innerHTML = "等级";
    b = Vx(a);
    b.style.textAlign = "left";
    b.style.paddingRight = "5px";
    b.innerHTML = "效果";
    b = Vx(a);
    b.style.textAlign = "right";
    b.style.paddingRight = "5px";
    b.innerHTML = "黄金";
    a = Vx(a);
    a.style.textAlign = "center";
    a.innerHTML = "装备"
};
function Pz(a, b) {
    this.lh = a;
    this.$ = b;
    this.Cr = this.gf = this.Oh = this.Af = this.Ie = this.Fi = this.Ei = this.item = null;
    this.qi()
}
Pz.prototype = new Mz;
e = Pz.prototype;
e.Xa = function() {};
e.Ne = function() {};
e.Zd = function() {};
e.ux = function(a) { (this.item = a) ? (a = this.item.Uk(), this.Ei.style.background = "url('spritesheet/items.png') -" + a.ub + "px -" + a.vb + "px", this.Fi.innerHTML = Lv(this.item), this.Ie.innerHTML = Kv(this.item), this.Af.innerHTML = this.item.ns + "", this.Oh.innerHTML = r(this.item.va) + " " + Jv(this.item), this.gf.innerHTML = r(this.item.zf), this.Ie.className = Dy(this.item.uf())) : (this.Ei.style.background = "", this.Fi.innerHTML = "", this.Ie.innerHTML = "", this.Af.innerHTML = "", this.Oh.innerHTML = "", this.gf.innerHTML = "", this.Ie.className = "")
};
e.qi = function() {
    var a = this.lh,
    b = a.insertCell(0);
    b.style.width = "50px";
    b.style.padding = "0";
    b.style.textAlign = "center";
    this.Ei = P("img", b, null, "itemImage");
    this.Ei.src = "images/Transparent.gif";
    this.Fi = a.insertCell(1);
    this.Fi.style.width = "280px";
    this.Ie = a.insertCell(2);
    this.Ie.style.width = "110px";
    this.Ie.style.textAlign = "center";
    this.Af = a.insertCell(3);
    this.Af.style.textAlign = "right";
    this.Af.style.paddingRight = "5px";
    this.Af.style.width = "70px";
    this.Oh = a.insertCell(4);
    this.Oh.style.width = "120px";
    this.gf = a.insertCell(5);
    this.gf.style.textAlign = "right";
    this.gf.style.paddingRight = "5px";
    this.gf.style.width = "80px"
};
function Qz(a, b) {
    this.F = a;
    this.Ya = !0;
    this.$ = b;
    this.zm = null;
    this.sf = []
}
Qz.prototype = new Xx;
e = Qz.prototype;
e.J = function() {
    var a;
    for (a = 0; a < this.sf.length; a++) this.sf[a].J();
    this.sf.length = 0;
    Ox(this.F);
    this.zm = null
};
e.ba = function() {
    if (! (0 > this.$ || this.$ >= w.i.D.length)) {
        this.zm || this.pf();
        var a = w.i.D[this.$],
        b = a.Z;
        b.length !== this.sf.length && this.mk(b.length);
        var c, d;
        for (c = 0; c < this.sf.length; c++) d = a.ef(b[c]),
        d !== this.sf[c].item && this.sf[c].ux(d)
    }
};
e.mk = function(a) {
    for (; this.sf.length > a;) this.zm.deleteRow( - 1),
    this.sf.splice(this.sf.length - 1, 1);
    for (; this.sf.length < a;) this.sf.push(new Pz(this.zm.insertRow(this.sf.length + 1), this.$))
};
e.pf = function() {
    var a = this.F;
    Ox(a);
    this.zm = P("table", M(a), null, "monsterTable");
    this.Ri(this.zm.insertRow(0))
};
e.Ri = function(a) {
    var b = Vx(a);
    b.style.textAlign = "center";
    b.style.padding = "0";
    b.innerHTML = "图标";
    Vx(a).innerHTML = "道具名称";
    b = Vx(a);
    b.style.textAlign = "center";
    b.innerHTML = "稀有度";
    b = Vx(a);
    b.style.textAlign = "right";
    b.style.paddingRight = "5px";
    b.innerHTML = "等级";
    b = Vx(a);
    b.style.textAlign = "left";
    b.style.paddingRight = "5px";
    b.innerHTML = "效果";
    a = Vx(a);
    a.style.textAlign = "right";
    a.style.paddingRight = "5px";
    a.innerHTML = "黄金"
};
function Rz(a) {
    this.F = "equipAllButtonContainer" + a;
    this.Ya = !0;
    this.$ = a;
    this.Xq = !1;
    this.gw = M("equipImprovements" + a);
    var b = this;
    this.gw.onclick = function() {
        b.Br();
        return ! 1
    }
}
Rz.prototype = new Xx;
Rz.prototype.J = function() {};
Rz.prototype.ba = function() {
    0 > this.$ || this.$ >= w.i.D.length || (this.Wt() ? this.Xq || (this.Xq = !0, this.gw.className = "upgradeButton") : this.Xq && (this.Xq = !1, this.gw.className = "disabledUpgradeButton"))
};
Rz.prototype.Br = function() {
    w.Di.Br(w.i.D[this.$])
};
Rz.prototype.Wt = function() {
    return w.Di.Wt(w.i.D[this.$])
};
function Sz(a, b, c) {
    this.F = b;
    this.C = a;
    this.$ = c;
    this.QD = "itemTableAdventurer" + c;
    this.mD = "adventurerEquippedItems" + c;
    this.nD = new Qz(this.mD, c);
    this.Jj = new Oz(this.QD, c);
    R(this, this.nD);
    R(this, new Rz(c));
    R(this, this.Jj)
}
Sz.prototype = new jy;
function Tz(a, b) {
    this.F = a;
    this.Ya = !0;
    this.$ = b;
    this.jt = new dy("技能", !0);
    this.fA = new dy("背包", !0);
    this.jt.ha = !0;
    this.zz = !1;
    var c = new gy("characterTabMenu" + this.$),
    d = new Uz(this.jt, "characterSkillsContainer" + this.$, this.$),
    f = new Sz(this.fA, "characterInventoryContainer" + this.$, this.$);
    hy(c, this.jt);
    hy(c, this.fA);
    R(this, c);
    R(this, d);
    R(this, f)
}
Tz.prototype = new Yx;
Tz.prototype.ba = function() {
    var a = w.i.D[this.$],
    a = 0 < a.de && a.Zi;
    this.zz !== a && (this.zz = a, this.jt.qh = a ? !0 : !1);
    $x(this)
};
function Vz(a, b) {
    this.F = a;
    this.Ya = !0;
    this.$ = b;
    this.xy = this.Jy = this.AB = this.hz = this.gz = this.ez = this.aj = this.Ap = this.pA = this.EB = this.Wz = this.bz = this.DB = this.Ij = this.rA = this.be = null;
    this.zu = this.iv = this.Mu = this.Ov = this.Pu = this.Ou = this.Nu = this.Kk = this.Ik = this.Gk = this.Pv = this.$u = this.Lu = this.Jk = this.Zu = this.$f = -1
}
Vz.prototype = new Xx;
Vz.prototype.J = function() {
    this.zu = this.iv = this.Mu = this.Ov = this.Pu = this.Ou = this.Nu = this.Kk = this.Ik = this.Gk = this.Pv = this.$u = this.Lu = this.Jk = this.Zu = this.$f = -1;
    var a = 0;
    this.be = P("table", M(this.F), null, "characteristicsTable");
    this.rA = Wx(this.be, "等级:", a++);
    this.Ij = Wx(this.be, "生命:", a++);
    this.DB = Wx(this.be, "法力:", a++);
    this.Wz = Wx(this.be, "生命回复:", a++);
    this.EB = Wx(this.be, "法力回复:", a++);
    this.pA = Wx(this.be, "杀死:", a++);
    this.Ap = Wx(this.be, "宠物杀死:", a++);
    this.aj = Wx(this.be, "昏迷次数:", a++);
    this.ez = Wx(this.be, "输出伤害:", a++);
    this.gz = Wx(this.be, "受到伤害:", a++);
    this.hz = Wx(this.be, "伤害抵抗:", a++);
    this.AB = Wx(this.be, "法术忽视:", a++);
    this.dD = Wx(this.be, "暴击几率:", a++);
    this.bz = Wx(this.be, "冷却回合:", a++);
    this.Jy = Wx(this.be, "每回合攻击次数:", a++);
    this.xy = Wx(this.be, "额外攻击:", a)
};
Vz.prototype.ba = function() {
    var a = w.i.D[this.$].K,
    b = a.Eb,
    c = a.Sa,
    d = a.Yc,
    f = Mw(a, !0),
    g = a.Pr + a.ap + Ys.t,
    h = a.ot + a.pq + Zs.t,
    l = a.im,
    n = a.Ff,
    p = a.vq,
    s = a.rj,
    u = a.sj,
    y = a.wo,
    A = a.xn,
    C = a.lm,
    v = 1 + a.Oj,
    a = 0 < a.Oj ? a.Wn: 0;
    this.$f !== b && (this.$f = b, this.rA.innerHTML = b + "");
    this.Zu !== c && (this.Zu = c, this.Ij.innerHTML = r(c));
    this.Jk !== d && (this.Jk = d, this.DB.innerHTML = r(d));
    this.Lu !== f && (this.Lu = f, this.bz.innerHTML = f + "");
    this.$u !== g && (this.$u = g, this.Wz.innerHTML = g + "%");
    this.Pv !== h && (this.Pv = h, this.EB.innerHTML = h + "%");
    this.Gk !== l && (this.Gk = l, this.pA.innerHTML = r(l));
    this.Ik !== n && (this.Ik = n, this.Ap.innerHTML = r(n));
    this.Kk !== p && (this.Kk = p, this.aj.innerHTML = r(p));
    this.Nu !== s && (this.Nu = s, this.ez.innerHTML = r(s));
    this.Ou !== u && (this.Ou = u, this.gz.innerHTML = r(u));
    this.Pu !== y && (this.Pu = y, this.hz.innerHTML = y + "%");
    this.Ov !== A && (this.Ov = A, this.AB.innerHTML = A + "%");
    this.Mu !== C && (this.Mu = C, this.dD.innerHTML = C + "%");
    this.iv != v && (this.iv = v, this.Jy.innerHTML = v + "");
    this.zu != a && (this.zu = a, this.xy.innerHTML = a + "%")
};
function Wz(a, b, c, d) {
    this.F = a;
    this.Ya = !0;
    this.qE = c;
    this.bD = d;
    this.$ = b;
    this.zB = this.vB = this.qA = this.gA = this.XB = this.Cn = null;
    this.Mv = this.Jv = this.hv = this.dv = this.Tv = -1
}
Wz.prototype = new Xx;
Wz.prototype.J = function() {
    this.Mv = this.Jv = this.hv = this.dv = this.Tv = -1;
    this.Cn = P("table", M(this.F), null, "characteristicsTable");
    var a = this.qE + ":",
    b = this.Cn.insertRow(0),
    c = document.createElement("th");
    c.className = "characteristicsTableLabel";
    b.appendChild(c);
    c.innerHTML = a;
    a = document.createElement("th");
    a.style.textAlign = "left";
    b.appendChild(a);
    this.XB = a;
    this.gA = Wx(this.Cn, "道具加成:", 1);
    this.qA = Wx(this.Cn, "等级加成:", 2);
    this.vB = Wx(this.Cn, "技能加成:", 3);
    this.zB = Wx(this.Cn, "法术加成:", 4)
};
Wz.prototype.ba = function() {
    var a = Xz(w.i.D[this.$].K, this.bD),
    b = $h(a),
    c = a.va,
    d = a.Pc,
    f = a.Xh,
    a = a.wc;
    this.Tv !== b && (this.Tv = b, this.XB.innerHTML = r(b));
    this.dv !== c && (this.dv = c, this.gA.innerHTML = r(c));
    this.hv !== d && (this.hv = d, this.qA.innerHTML = r(d));
    this.Mv !== f && (this.Mv = f, this.zB.innerHTML = r(f) + "%");
    this.Jv !== a && (this.Jv = a, this.vB.innerHTML = r(a) + "%")
};
function Xz(a, b) {
    switch (b) {
    case 0:
        return a.sd;
    case 1:
        return a.je;
    case 2:
        return a.xe;
    case 3:
        return a.Ae;
    case 4:
        return a.Jb;
    case 5:
        return a.Ke
    }
    return null
};
function Yz(a, b) {
    this.F = a;
    this.Ya = !0;
    this.$ = b;
    this.bB = new Vz(a, b);
    this.iz = new Wz(a, b, "伤害", 0);
    this.Gy = new Wz(a, b, "护甲", 1);
    this.Hy = new Wz(a, b, "攻击等级", 2);
    this.lz = new Wz(a, b, "防御等级", 3);
    this.vA = new Wz(a, b, "最大生命", 4);
    this.yA = new Wz(a, b, "最大法力", 5)
}
Yz.prototype = new Xx;
Yz.prototype.J = function() {
    Ox(this.F);
    0 > this.$ || this.$ >= w.i.D.length || (this.bB.J(), this.iz.J(), this.Gy.J(), this.Hy.J(), this.lz.J(), this.vA.J(), this.yA.J())
};
Yz.prototype.ba = function() {
    0 > this.$ || this.$ >= w.i.D.length || (this.bB.Xa(), this.iz.Xa(), this.Gy.Xa(), this.Hy.Xa(), this.lz.Xa(), this.vA.Xa(), this.yA.Xa())
};
function Zz(a, b, c) {
    this.F = b;
    this.C = a;
    this.$ = c;
    a = new is([[Ax[c]]], !1);
    R(this, new Yz("characterPropertiesContainer" + c, c));
    R(this, new Fy("characterLevelUpButtonContainer" + c, a, !0));
    R(this, new Tz("characterTabContainer" + c, c))
}
Zz.prototype = new jy;
e = Zz.prototype;
e.Me = function() {
    this.C.qa = !1;
    this.C.ha = !1
};
e.Zd = function() {
    this.C.qa = !1;
    this.C.ha = !1
};
e.Ne = function() {
    $z(this)
};
e.J = function() {
    Zx(this);
    $z(this)
};
function $z(a) {
    var b = a.$ < w.i.D.length,
    c = a.C;
    c.qa = b;
    c.ha = !1;
    b && (b = w.i.D[a.$], a = a.tw(b), b = b.Kc.vg, 0 < a ? (c.label = b + " " + a, c.qh = !0) : (c.label = b, c.qh = !1))
}
e.tw = function(a) {
    return a.Zi ? a.de + a.Ci: 0
};
function Uz(a, b, c) {
    this.F = b;
    this.C = a;
    this.$ = c;
    this.ry = this.qy = this.Rl = this.hj = this.Ax = null;
    this.Uc = [];
    this.Vc = [];
    this.Nf = [];
    this.Pn = []
}
Uz.prototype = new jy;
Uz.prototype.J = function() {
    Ox(this.F);
    this.Ax = null;
    this.Uc.length = 0;
    this.Vc.length = 0;
    this.Nf.length = 0;
    this.Pn.length = 0;
    this.Zn();
    var a = this.F,
    b = M(a);
    if (b && !(0 > this.$ || this.$ >= w.i.D.length)) if (this.hj) {
        this.Ax = P("table", b, null, "adventurerSkillTreeTable");
        var b = this.hj.Ha,
        c = this.Rl.Ha,
        d = this.qy.Ha,
        f = this.ry.Ha,
        g = Math.max(b.length, Math.max(c.length, Math.max(d.length, f.length))),
        h,
        l,
        n,
        p,
        s;
        for (h = 0; h < g; h++) l = this.Ax.insertRow(h),
        n = l.insertCell(0),
        p = l.insertCell(1),
        s = l.insertCell(2),
        l = l.insertCell(3),
        n.id = a + "_" + h + "_0",
        p.id = a + "_" + h + "_1",
        s.id = a + "_" + h + "_2",
        l.id = a + "_" + h + "_3",
        n.width = 150,
        p.width = 150,
        s.width = 150,
        l.width = 150,
        h < b.length && this.Uc.push(new ky(n.id, b[h], h, !0)),
        h < c.length && this.Vc.push(new ky(p.id, c[h], h, !0)),
        h < d.length && this.Nf.push(new ky(s.id, d[h], h, !0)),
        h < f.length && this.Pn.push(new ky(l.id, f[h], h, !0))
    } else console.log("no upgrades configured for character");
    for (a = 0; a < this.Uc.length; a++) this.Uc[a].J();
    for (a = 0; a < this.Vc.length; a++) this.Vc[a].J();
    for (a = 0; a < this.Nf.length; a++) this.Nf[a].J();
    for (a = 0; a < this.Pn.length; a++) this.Pn[a].J()
};
Uz.prototype.Zn = function() {
    if (0 > this.$ || this.$ >= w.i.D.length) this.ry = this.qy = this.Rl = this.hj = null;
    else {
        var a = w.i.D[this.$];
        this.hj = a.ei;
        this.Rl = a.fi;
        this.qy = a.gi;
        this.ry = a.hi
    }
};
Uz.prototype.ba = function() {
    var a;
    for (a = 0; a < this.Uc.length; a++) this.Uc[a].Xa();
    for (a = 0; a < this.Vc.length; a++) this.Vc[a].Xa();
    for (a = 0; a < this.Nf.length; a++) this.Nf[a].Xa();
    for (a = 0; a < this.Pn.length; a++) this.Pn[a].Xa()
};
function aA() {
    this.F = "monsterKillCountContainer";
    this.Ya = !0;
    this.Hw = "killCountPanel";
    this.rm = -1
}
aA.prototype = new Xx;
aA.prototype.J = function() {
    this.rm = -1
};
aA.prototype.ba = function() {
    var a = w.i.da.Je;
    a !== this.rm && (this.rm = a, Ux(this.Hw, "" + xa(a)))
};
function bA() {
    this.F = "monsterUpgradeValuesContainer";
    this.Ya = !0;
    this.ov = this.jv = this.Vv = this.zv = this.Fv = this.Wu = this.fv = this.Du = this.pv = this.lv = this.ev = -1
}
bA.prototype = new Xx;
bA.prototype.J = function() {};
bA.prototype.ba = function() {
    this.Wu !== E.Lr.t && (this.Wu = E.Lr.t, Ux("goldDropChance", this.Wu + "%"));
    this.jv !== E.ys.t && (this.jv = E.ys.t, Ux("maxGoldPerDrop", this.jv + ""));
    this.ov !== E.As.t && (this.ov = E.As.t, Ux("minGoldPerDrop", this.ov + ""));
    this.ev !== E.ls.t && (this.ev = E.ls.t, Ux("itemDropChance", this.ev + "%"));
    this.Fv !== E.$s.t && (this.Fv = E.$s.t, Ux("scrollDropChance", this.Fv + "%"));
    this.zv !== E.Ns.t && (this.zv = E.Ns.t, Ux("potionDropChance", this.zv + "%"));
    this.fv !== E.lp.t && (this.fv = E.lp.t, Ux("itemLevelBonus", this.fv + "%"));
    this.Du !== E.Yl.t && (this.Du = E.Yl.t, Ux("itemRarityChance", this.Du + "%"));
    this.Vv !== E.Et.t && (this.Vv = E.Et.t, Ux("treasureChestChance", this.Vv + "%"));
    this.lv !== E.Pj.t && (this.lv = E.Pj.t, Ux("maxMonstersPerRoom", this.lv + ""));
    this.pv !== E.Ym.t && (this.pv = E.Ym.t, Ux("minMonstersPerRoom", this.pv + ""))
};
function cA(a, b) {
    this.lh = a;
    this.Sb = b;
    this.kd = this.pb = this.ng = this.xo = this.$n = this.Yn = this.vo = this.Ij = this.Mo = this.wq = this.yq = this.Es = null;
    this.Sv = this.$f = this.Jh = this.Uv = -1;
    this.dx = 80;
    this.Cp = null;
    this.qi()
}
cA.prototype.gq = function(a) {
    this.Sb = a
};
cA.prototype.qi = function() {
    var a = this.lh,
    b = this.Sb.ll,
    c = a.insertCell(0);
    c.style.width = "50px";
    c.style.padding = "0";
    c.style.textAlign = "center";
    this.Cp = P("img", c, null, "characterImage");
    this.Cp.src = "images/Transparent.gif";
    this.Cp.style.background = "url('spritesheet/monsters.png') -" + b.ub + "px -" + (b.vb + 10) + "px";
    this.Cp.style.height = "30px";
    this.Es = a.insertCell(1);
    this.Es.style.width = "200px";
    this.Es.innerHTML = this.Sb.Vk();
    this.Mo = a.insertCell(2);
    this.Mo.style.width = "80px";
    this.Mo.style.textAlign = "right";
    this.Mo.style.paddingRight = "5px";
    this.Ij = a.insertCell(3);
    this.Ij.style.width = "80px";
    this.Ij.style.textAlign = "right";
    this.Ij.style.paddingRight = "5px";
    this.vo = a.insertCell(4);
    this.vo.style.width = "80px";
    this.vo.style.textAlign = "right";
    this.vo.style.paddingRight = "5px";
    this.Yn = a.insertCell(5);
    this.Yn.style.width = "80px";
    this.Yn.style.textAlign = "right";
    this.Yn.style.paddingRight = "5px";
    this.$n = a.insertCell(6);
    this.$n.style.width = "80px";
    this.$n.style.textAlign = "right";
    this.$n.style.paddingRight = "5px";
    this.xo = a.insertCell(7);
    this.xo.style.width = "80px";
    this.xo.style.textAlign = "right";
    this.xo.style.paddingRight = "5px";
    this.yq = a.insertCell(8);
    this.yq.style.width = "80px";
    this.yq.style.textAlign = "right";
    this.yq.style.paddingRight = "5px";
    this.wq = a.insertCell(9);
    this.wq.style.width = "80px";
    this.wq.style.textAlign = "right";
    this.wq.style.paddingRight = "5px";
    this.ng = a.insertCell(10);
    this.ng.style.width = this.dx + "px";
    this.ng.style.paddingLeft = "5px";
    this.ng.style.paddingRight = "5px";
    a = P("div", this.ng, null, null);
    a.style.position = "relative";
    a.style.border = "1px solid #2c2c50";
    a.style.height = "15px";
    a.style.width = this.dx + "px";
    this.pb = P("div", a, null, null);
    this.pb.style.position = "absolute";
    this.pb.style.top = "0";
    this.pb.style.left = "0";
    this.pb.style.backgroundColor = "#F00";
    this.pb.style.height = "15px";
    this.pb.style.width = "0px";
    this.kd = P("div", a, null, null);
    this.kd.style.position = "absolute";
    this.kd.style.textAlign = "center";
    this.kd.style.top = "0";
    this.kd.style.left = "0";
    this.kd.style.height = "15px";
    this.kd.style.width = "100%";
    this.kd.style.zIndex = "10"
};
cA.prototype.J = function() {
    this.Jh = this.Uv = this.$f = this.Sv = -1
};
cA.prototype.Xa = function() {
    var a = this.Sb.ml,
    b = this.Sb.ek,
    c = this.Sb.xq,
    d = Math.min(1, a / b),
    d = this.dx * d | 0;
    if (this.$f != this.Sb.xd || this.Sv != this.Sb.Sj) {
        this.Mo.innerHTML = r(this.Sb.No);
        this.Ij.innerHTML = r(this.Sb.$o);
        this.vo.innerHTML = r(this.Sb.Gp);
        this.Yn.innerHTML = r(this.Sb.Ep);
        this.$n.innerHTML = r(this.Sb.Fp);
        this.xo.innerHTML = r(this.Sb.Hp);
        this.wq.innerHTML = r(this.Sb.Sj);
        if (this.$f != this.Sb.xd) {
            this.Es.innerHTML = this.Sb.Vk();
            var f = this.Sb.ll;
            this.Cp.style.background = "url('spritesheet/monsters.png') -" + f.ub + "px -" + (f.vb + 10) + "px"
        }
        this.$f = this.Sb.xd;
        this.Sv = this.Sb.Sj
    }
    this.Uv !== c && (this.Uv = c, this.yq.innerHTML = r(c));
    this.Jh !== d && (this.Jh = d, this.pb.style.width = d + "px", this.kd.innerHTML = a > b ? "最大": r(a) + " / " + r(b))
};
function dA(a, b) {
    this.F = b;
    this.C = a;
    this.Dp = null;
    this.vi = this.xd = -1;
    this.Tj = []
}
dA.prototype = new jy;
dA.prototype.J = function() {
    if (this.Dp) {
        var a;
        for (a = 0; a < this.Tj.length; a++) this.Tj[a].J()
    }
    this.xd = -1;
    this.vi = -2
};
dA.prototype.ba = function() {
    if (1 > this.xd) console.log("MonsterTableView.updateViewContents  monsterLevel=" + this.xd);
    else {
        if (this.Dp) {
            if (this.vi !== this.xd) {
                var a = Th(w.ob, this.xd),
                b;
                if (a.length !== this.Tj.length) console.log("MonsterTableView.updateMonsterLevelRows length mismatch");
                else for (b = 0; b < this.Tj.length; b++) this.Tj[b].gq(a[b])
            }
        } else this.pf();
        this.vi = this.xd;
        for (a = 0; a < this.Tj.length; a++) this.Tj[a].Xa()
    }
};
dA.prototype.pf = function() {
    var a = this.F;
    Ox(a);
    var b = M(a),
    a = Th(w.ob, this.xd);
    this.Dp = P("table", b, null, "monsterTable");
    this.Ri(this.Dp.insertRow(0));
    for (b = 0; b < a.length; b++) this.Tj.push(new cA(this.Dp.insertRow(b + 1), a[b]))
};
dA.prototype.Ri = function(a) {
    var b = Vx(a);
    b.style.textAlign = "center";
    b.style.padding = "0";
    b.innerHTML = "图标";
    Vx(a).innerHTML = "怪物类型";
    b = Vx(a);
    b.style.textAlign = "right";
    b.style.paddingRight = "5px";
    b.innerHTML = "经验";
    b = Vx(a);
    b.style.textAlign = "right";
    b.style.paddingRight = "5px";
    b.innerHTML = "生命";
    b = Vx(a);
    b.style.textAlign = "right";
    b.style.paddingRight = "5px";
    b.innerHTML = "伤害";
    b = Vx(a);
    b.style.textAlign = "right";
    b.style.paddingRight = "5px";
    b.innerHTML = "护甲";
    b = Vx(a);
    b.style.textAlign = "right";
    b.style.paddingRight = "5px";
    b.innerHTML = "攻击";
    b = Vx(a);
    b.style.textAlign = "right";
    b.style.paddingRight = "5px";
    b.innerHTML = "防御";
    b = Vx(a);
    b.style.textAlign = "right";
    b.style.paddingRight = "5px";
    b.innerHTML = "总计杀死";
    b = Vx(a);
    b.style.textAlign = "right";
    b.style.paddingRight = "5px";
    b.innerHTML = "怪物等级";
    Vx(a).innerHTML = "进度"
};
function eA(a) {
    this.F = "monstersTabContent";
    this.C = a;
    this.zg = [];
    for (a = 0; a < Bs; a++) this.zg.push(fA(a, a + 1));
    var b = new gy("monsterTabMenu");
    for (a = 0; a < this.zg.length; a++) hy(b, this.zg[a].C);
    R(this, new aA);
    R(this, new bA);
    R(this, new Fy("monsterUpgradeButtonsContainer", Kx, !1));
    R(this, b);
    for (a = 0; a < this.zg.length; a++) R(this, this.zg[a].view)
}
eA.prototype = new jy;
e = eA.prototype;
e.Me = function() {
    this.C.qa = !1;
    this.C.ha = !1
};
e.Ne = function() {
    this.C.qa = !0;
    this.C.ha = !1
};
e.Zd = function() {
    this.C.qa = !1;
    this.C.ha = !1
};
e.J = function() {
    this.C.qa = !0;
    this.C.ha = !1;
    gA(this);
    hA(this);
    Zx(this)
};
function fA(a, b) {
    var c = {},
    d = 1 === b;
    c.C = new dy("等级 " + b, d);
    d && (c.C.ha = !0);
    var f = "monstersTabContainer" + a,
    g = M(f);
    g ? Px(g) : (g = P("div", M("monsterTabContainerParent"), f, "tabContainer scrollingContainer"), d || Qx(g));
    c.view = new dA(c.C, f);
    c.view.xd = b;
    return c
}
e.ba = function() {
    gA(this);
    hA(this);
    $x(this)
};
function gA(a) {
    var b, c = w.ob.hd,
    d, f;
    for (f = 0; f < a.zg.length; f++) d = a.zg[f],
    b = d.view.xd,
    b !== c && (d.C.label = "等级 " + c, d.view.xd = c),
    c++
}
function hA(a) {
    var b = w.ob,
    c, d, f, g = !1;
    for (c = 0; c < a.zg.length; c++) f = a.zg[c],
    d = f.view.xd,
    d = b.hd <= d && d <= b.fc,
    f.C.qa = d,
    !d && f.C.ha && (f.C.ha = !1, g = !0);
    if (g) for (c = 0; c < a.zg.length; c++) if (a.zg[c].C.qa) {
        a.zg[c].C.ha = !0;
        break
    }
};
function iA(a) {
    return a.$b ? "#222": a.cb ? "#080": Jc(a) ? w.ob.fc >= a.Jf ? "#850": "#A30": a.ye ? "#A80": "#AAA"
};
function jA() {
    this.F = "castleMapContainer";
    this.Ya = !0;
    this.ws = null;
    this.vs = [];
    this.Fu = -1
}
jA.prototype = new Xx;
jA.prototype.J = function() {
    this.Fu = -1;
    Ox(this.F);
    this.ws = null;
    this.vs.length = 0
};
jA.prototype.ba = function() {
    this.ws || this.pf();
    var a;
    a = w.kb.cm;
    if (this.Fu != a) {
        this.Fu = a;
        a = w.Pe;
        var b, c, d = a.Rh + a.Eh - a.Rh,
        f = a.Sh + a.Eh - a.Sh,
        g, h;
        for (c = 0; c < f; c++) for (b = 0; b < d; b++) if (g = this.vs[b][c], h = a.Mr[b][c]) h = h.cu,
        h = iA(h),
        g.style.backgroundColor != h && (g.style.backgroundColor = h)
    }
};
jA.prototype.pf = function() {
    var a = this.F;
    Ox(a);
    var b = w.Pe,
    c = b.Rh,
    d = b.Sh,
    f = b.Rh + b.Eh,
    g = b.Sh + b.Eh,
    h;
    this.ws = P("table", M(a), null, null);
    for (var a = f - c,
    d = g - d,
    l, g = 0; g < a; g++) this.vs.push([]);
    for (c = 0; c < d; c++) for (f = this.ws.insertRow(c), g = 0; g < a; g++) {
        l = f.insertCell(g);
        l = P("div", l, null, null);
        l.style.width = "39px";
        l.style.height = "39px";
        if (h = b.Mr[g][c]) if (h = fd(h.io)) {
            h = P("img", l, null, null);
            h.src = "images/Transparent.gif";
            h.style.width = "35px";
            h.style.height = "35px";
            var n = w.Kj.v("CrownGolden.PNG");
            h.style.background = "url('spritesheet/items.png') -" + n.ub + "px -" + n.vb + "px"
        }
        this.vs[g].push(l)
    }
};
function kA() {
    this.F = "castleTableContainer";
    this.Ya = !0;
    this.$e = null;
    this.nf = []
}
kA.prototype = new Xx;
e = kA.prototype;
e.J = function() {
    this.nf.length = 0;
    Ox(this.F);
    this.$e = null
};
e.ba = function() {
    this.$e || this.pf();
    var a = w.kb.pd;
    a.length !== this.nf.length && this.mk(a.length);
    var b;
    for (b = 0; b < this.nf.length; b++) this.nf[b].xc !== a[b] && lA(this.nf[b], a[b]),
    this.nf[b].Xa()
};
e.mk = function(a) {
    for (; this.nf.length > a;) this.$e.deleteRow( - 1),
    this.nf.splice(this.nf.length - 1, 1);
    for (; this.nf.length < a;) this.nf.push(new mA(this.$e.insertRow(this.nf.length + 1)))
};
e.pf = function() {
    var a = this.F;
    Ox(a);
    var b = w.kb.pd,
    c;
    this.$e = P("table", M(a), null, "monsterTable");
    this.Ri(this.$e.insertRow(0));
    for (c = 0; c < b.length; c++) a = new mA(this.$e.insertRow(c + 1)),
    lA(a, b[c]),
    this.nf.push(a)
};
e.Ri = function(a) {
    Vx(a).innerHTML = "名称";
    Vx(a).innerHTML = "状态"
};
function mA(a) {
    this.lh = a;
    this.kd = this.pb = this.ng = this.mf = this.xc = null;
    this.Us = 120;
    this.Rv = this.Cu = this.fb = "";
    this.Kv = 0;
    this.qi()
}
mA.prototype.J = function() {};
function lA(a, b) {
    a.xc = b;
    a.Cu = "";
    a.Rv = "";
    a.Kv = 0;
    a.fb = ""
}
mA.prototype.qi = function() {
    var a = this.lh;
    this.mf = a.insertCell(0);
    this.mf.style.width = "240px";
    this.ng = a.insertCell(1);
    this.ng.style.width = this.Us + "px";
    this.ng.style.paddingLeft = "5px";
    this.ng.style.paddingRight = "5px";
    a = P("div", this.ng, null, null);
    a.style.position = "relative";
    a.style.border = "1px solid #2c2c50";
    a.style.height = "15px";
    a.style.width = this.Us + "px";
    this.pb = P("div", a, null, null);
    this.pb.style.position = "absolute";
    this.pb.style.top = "0";
    this.pb.style.left = "0";
    this.pb.style.backgroundColor = "#F00";
    this.pb.style.height = "15px";
    this.pb.style.width = "0px";
    this.kd = P("div", a, null, null);
    this.kd.style.position = "absolute";
    this.kd.style.textAlign = "center";
    this.kd.style.top = "0";
    this.kd.style.left = "0";
    this.kd.style.height = "15px";
    this.kd.style.width = "100%";
    this.kd.style.zIndex = "10"
};
mA.prototype.Xa = function() {
    if (this.xc) {
        var a = this.xc.mi;
        this.fb !== a && (this.fb = a, this.mf.innerHTML = a);
        a = iA(this.xc);
        this.Cu != a && (this.Cu = a, this.pb.style.backgroundColor = a);
        a = this.xc;
        a = a.$b ? "未解锁": a.cb ? "已征服": Jc(a) ? w.ob.fc >= a.Jf ? "准备攻击": "怪物等级" + a.Jf: a.ye ? "计划攻击": "地牢" + a.yk + " / " + a.Ab.length;
        this.Rv != a && (this.Rv = a, this.kd.innerHTML = a);
        a = this.xc;
        if (a.$b) a = 0;
        else if (a.cb || Jc(a) || a.ye || a.Bj) a = this.Us;
        else var a = this.xc.yk,
        b = this.xc.Ab,
        a = 0 === b.length ? 1 : Math.min(1, a / b.length),
        a = this.Us * a | 0;
        this.Kv != a && (this.Kv = a, this.pb.style.width = a + "px")
    }
};
function nA(a) {
    this.F = "castlesTabContent";
    this.C = a;
    R(this, new kA);
    R(this, new jA)
}
nA.prototype = new jy;
nA.prototype.Me = function() {
    this.C.qa = !1;
    this.C.ha = !1
};
nA.prototype.Ne = function() {
    this.C.qa = !0;
    this.C.ha = !1
};
nA.prototype.Zd = function() {
    this.C.qa = !1;
    this.C.ha = !1
};
nA.prototype.J = function() {
    this.C.qa = !0;
    this.C.ha = !1;
    Zx(this)
};
function oA() {
    this.F = "goldContainer";
    this.Ya = !0;
    this.uD = "partyGoldPanel";
    this.Dk = -1
}
oA.prototype = new Xx;
oA.prototype.J = function() {
    this.Dk = -1
};
oA.prototype.ba = function() {
    var a = w.i.da.fd;
    a !== this.Dk && (this.Dk = a, Ux(this.uD, "" + xa(a)))
};
function tz() {
    this.F = "treasureChestLootButtonPanel";
    this.Ya = !1;
    this.ti = "";
    this.om = this.Ml = this.po = this.lc = this.button = null
}
tz.prototype = new Xx;
tz.prototype.Pm = function() {
    var a = pA();
    return a && !a.Kg
};
tz.prototype.J = function() {
    this.lc = null;
    qA(this)
};
tz.prototype.ba = function() {
    this.button || qA(this);
    var a = pA();
    if (a != this.lc && (this.lc = a)) {
        var b = this.lc.Mf;
        this.Ml.innerHTML = 1 === b ? "搜索财宝箱!": 2 === b ? "搜索武器架!": 3 === b ? "搜索书架!": "搜索事物!";
        this.om.innerHTML = "在房间内点击.";
        a && (b = a.Kg ? a.PA: a.Vy, this.po.style.background = "url('spritesheet/terrain.png') -" + b.ub + "px -" + b.vb + "px")
    }
    b = this.Ro();
    this.ti !== b && (this.ti = b, this.button.className = b, a && a.el && (this.om.innerHTML = "正在搜索中..."))
};
function qA(a) {
    var b = M(a.F);
    if (b) {
        Px(b);
        a.ti = a.Ro();
        a.button = P("div", b, a.F, a.ti);
        a.button.onmouseup = function() {
            if (a.lc && !a.lc.Kg) {
                var b = a.lc;
                b.el = !0;
                w.i.da.hq(b)
            }
            return ! 1
        };
        var c = P("table", a.button, null, null);
        c.style.width = "100%";
        var b = c.insertRow(0),
        c = c.insertRow(1),
        d = b.insertCell(0);
        d.rowSpan = 2;
        d.style.width = "50px";
        d.style.height = "50px";
        d.style.textAlign = "center";
        a.po = P("img", d, null, null);
        a.po.src = "images/Transparent.gif";
        a.po.style.width = "50px";
        a.po.style.height = "50px";
        b = b.insertCell(1);
        b.style.textAlign = "left";
        a.Ml = P("span", b, null, null);
        a.om = c.insertCell(0);
        a.om.colSpan = 2;
        a.om.style.width = "200px";
        a.om.style.textAlign = "left"
    }
}
tz.prototype.Ro = function() {
    return ! this.lc || this.lc.Kg || this.lc.el ? "lootButtonDisabled centeredElement": "lootButton centeredElement"
};
function pA() {
    if (!w.wb) {
        var a, b;
        for (a = 0; a < w.i.D.length; a++) if (b = Ji(w.th, w.i.D[a].p.w)) return b
    }
    return null
};
function rA(a, b) {
    this.lh = a;
    this.ui = this.ua = null;
    this.yr = new Es(this.ua);
    this.px = this.Gx = this.mf = this.Vg = this.wr = this.Co = null;
    this.pB = "secureCell_" + b + "_" + this.lh.rowIndex;
    this.W = this.cj = this.ai = this.sh = this.ng = this.Ix = null;
    this.Gu = this.Bk = this.Qv = "";
    this.mw = this.pu = -1;
    this.Bt = !1;
    this.Ct = 260;
    this.qi()
}
rA.prototype.J = function() {
    this.ui = null;
    this.ua && this.W.J()
};
rA.prototype.ct = function(a) {
    var b = !this.ua;
    this.ua = a;
    this.yr.ct(this.ua);
    this.W.Rc(this.yr);
    this.mw = this.pu = -1;
    this.Gu = this.Bk = this.Qv = "";
    b && this.W.J()
};
rA.prototype.qi = function() {
    var a = this.lh;
    this.Co = a.insertCell(0);
    this.Co.style.width = "50px";
    this.Co.style.padding = "0";
    this.Co.style.textAlign = "center";
    this.wr = P("img", this.Co, null, "terrainImage");
    this.wr.src = "images/Transparent.gif";
    if (this.ua) {
        var b = w.I.v(this.ua.Fo);
        this.wr.style.background = "url('spritesheet/terrain.png') -" + b.ub + "px -" + b.vb + "px"
    }
    this.Vg = a.insertCell(1);
    this.Vg.style.width = "200px";
    this.mf = a.insertCell(2);
    this.mf.style.width = "200px";
    this.Gx = a.insertCell(3);
    this.Gx.style.width = "90px";
    this.px = a.insertCell(4);
    this.px.style.width = "200px";
    this.px.id = this.pB;
    this.Ix = a.insertCell(5);
    this.Ix.style.width = this.Ct + "px";
    this.W = new ky(this.pB, this.yr, this.lh.rowIndex, !0);
    this.cj = P("div", this.Ix, null, null);
    this.cj.style.position = "relative";
    this.cj.style.border = "1px solid #2c2c50";
    this.cj.style.height = "15px";
    this.cj.style.width = this.Ct + "px";
    this.sh = P("div", this.cj, null, null);
    this.sh.style.position = "absolute";
    this.sh.style.top = "0";
    this.sh.style.left = "0";
    this.sh.style.backgroundColor = "#F00";
    this.sh.style.height = "15px";
    this.sh.style.width = "0px";
    this.ai = P("div", this.cj, null, null);
    this.ai.style.position = "absolute";
    this.ai.style.textAlign = "center";
    this.ai.style.top = "0";
    this.ai.style.left = "0";
    this.ai.style.height = "15px";
    this.ai.style.width = "100%";
    this.ai.style.zIndex = "10";
    this.Bt = !0
};
rA.prototype.Xa = function() {
    if (this.ua) {
        var a = this.ua.qf,
        b = this.ua.Lc,
        c = this.ua.Eo,
        d = this.ua.zj.mi,
        f = this.ua.oe,
        g;
        g = this.ua;
        g = g.oe ? g.Lc ? "等待中": g.qf && !g.Lc ? "收获中": "收获": g.Lc ? "已清空": g.qf && !g.Lc ? "探索中": "已探索?";
        var h;
        h = this.ua;
        h = h.Lc ? Math.max(0, Math.min(100, 100 * (w.i.$a - h.Mg) / 1500 | 0)) : 0;
        var l;
        l = this.ua;
        l = l.Lc ? 0 : Math.max(0, Math.min(100, 100 * (w.i.$a - l.zi) / 1200 | 0));
        a = a && (f || b);
        this.ui !== this.ua && (this.ui = this.ua, f = w.I.v(this.ua.Fo), this.wr.style.background = "url('spritesheet/terrain.png') -" + f.ub + "px -" + f.vb + "px");
        this.Bk !== c && (this.Bk = c, this.Vg.innerHTML = c);
        this.Gu !== d && (this.Gu = d, this.mf.innerHTML = d);
        this.Qv !== g && (this.Qv = g, this.Gx.innerHTML = g);
        this.Bt !== a && ((this.Bt = a) ? Rx(this.cj) : Qx(this.cj));
        a && (b ? this.pu !== h && (this.pu = h, b = h / 100 * this.Ct | 0, this.sh.style.width = b + "px", this.sh.style.backgroundColor = "#F00", this.ai.innerHTML = "地牢再次受到侵袭 " + h + "%") : this.mw !== l && (this.mw = l, b = l / 100 * this.Ct | 0, this.sh.style.width = b + "px", this.sh.style.backgroundColor = "#080", this.ai.innerHTML = "收获地牢 " + l + "%"));
        this.ua && (gs(this.yr), this.W.Xa())
    }
};
function sA(a, b, c) {
    this.F = c;
    this.C = a;
    this.dw = b;
    this.bf = null;
    this.rf = []
}
sA.prototype = new jy;
e = sA.prototype;
e.J = function() {
    this.rf.length = 0;
    Ox(this.F);
    this.bf = null
};
e.ba = function() {
    this.bf || this.pf();
    var a = tA(this);
    a.length !== this.rf.length && this.mk(a.length);
    var b;
    for (b = 0; b < this.rf.length; b++) this.rf[b].ua !== a[b] && this.rf[b].ct(a[b]),
    this.rf[b].Xa()
};
e.mk = function(a) {
    for (; this.rf.length > a;) this.bf.deleteRow( - 1),
    this.rf.splice(this.rf.length - 1, 1);
    for (; this.rf.length < a;) this.rf.push(new rA(this.bf.insertRow(this.rf.length + 1), this.dw))
};
e.pf = function() {
    var a = this.F;
    Ox(a);
    var b = tA(this),
    c;
    this.bf = P("table", M(a), null, "monsterTable");
    this.Ri(this.bf.insertRow(0));
    for (c = 0; c < b.length; c++) a = new rA(this.bf.insertRow(c + 1), this.dw),
    a.ct(b[c]),
    this.rf.push(a)
};
function tA(a) {
    switch (a.dw) {
    case 0:
        return w.Aa.uj;
    case 1:
        return w.Aa.Ge;
    case 2:
        return w.Aa.ze;
    case 3:
        return w.Aa.dg;
    default:
        return w.Aa.uj
    }
}
e.Ri = function(a) {
    Vx(a).innerHTML = "图标";
    Vx(a).innerHTML = "地牢";
    Vx(a).innerHTML = "城堡";
    Vx(a).innerHTML = "状态";
    Vx(a).innerHTML = "收获";
    Vx(a).innerHTML = "倒计时"
};
function uA(a) {
    this.F = "dungeonsTabContent";
    this.C = a;
    this.nr = new dy(vA(0, 0), !0);
    this.zw = new dy(vA(1, 0), !0);
    this.qu = new dy(vA(2, 0), !0);
    this.qx = new dy(vA(3, 0), !0);
    a = new gy("dungeonTabMenu");
    var b = new sA(this.nr, 0, "discoveredDungeonsTableContainer"),
    c = new sA(this.zw, 1, "infestedDungeonsTableContainer"),
    d = new sA(this.qu, 2, "clearedDungeonsTableContainer"),
    f = new sA(this.qx, 3, "farmedDungeonsTableContainer");
    this.nr.ha = !0;
    hy(a, this.nr);
    hy(a, this.zw);
    hy(a, this.qu);
    hy(a, this.qx);
    this.Hz = this.Uy = this.aA = this.nz = -1;
    R(this, new oA);
    R(this, a);
    R(this, b);
    R(this, c);
    R(this, d);
    R(this, f)
}
uA.prototype = new jy;
e = uA.prototype;
e.Me = function() {
    this.C.qa = !1;
    this.C.ha = !1
};
e.Ne = function() {
    this.C.qa = !0;
    this.C.ha = !1
};
e.Zd = function() {
    this.C.qa = !1;
    this.C.ha = !1
};
e.J = function() {
    this.C.qa = !0;
    this.C.ha = !1;
    Zx(this)
};
e.ba = function() {
    var a = w.Aa.uj.length,
    b = w.Aa.Ge.length,
    c = w.Aa.ze.length,
    d = w.Aa.dg.length;
    this.nz !== a && (this.nz = a, this.nr.label = vA(0, a));
    this.aA !== b && (this.aA = b, this.zw.label = vA(1, b));
    this.Uy !== c && (this.Uy = c, this.qu.label = vA(2, c));
    this.Hz !== d && (this.Hz = d, this.qx.label = vA(3, d));
    $x(this)
};
function vA(a, b) {
    return yA(a) + " (" + b + ")"
}
function yA(a) {
    switch (a) {
    case 0:
        return "发现的地牢";
    case 1:
        return "探索中的地牢";
    case 2:
        return "清空的地牢";
    case 3:
        return "地牢农场";
    default:
        return "Error"
    }
};
function BA(a) {
    this.F = "gameOverTabContent";
    this.C = a;
    this.ql = !1
}
BA.prototype = new jy;
e = BA.prototype;
e.Me = function() {
    this.C.qa = !0;
    this.C.ha = !0
};
e.Ne = function() {
    this.C.qa = !1;
    this.C.ha = !1
};
e.Zd = function() {
    this.C.qa = !1;
    this.C.ha = !1
};
e.J = function() {
    this.C.qa = !1;
    this.C.qa = !1;
    Ox(this.F);
    this.ql = !1
};
e.ba = function() {
    this.ql || (KA(this), this.ql = !0)
};
function KA(a) {
    Ox(a.F);
    a = M(a.F);
    MA(a);
    a = P("div", a, null, "gameOverContentsDiv");
    P("div", a, null, "gameOverHeading").innerHTML = "末日危机2胜利!";
    var b = P("div", a, null, "gameOverBlurb");
    P("p", b, null, null).innerHTML = "你征服了每一座城堡,并将冰冻的世界变为绿色的国度.";
    P("p", b, null, null).innerHTML = "末日大陆上的人民终于从怪物的蹂躏下解放出来,不再需要战战兢兢的度日!";
    P("p", b, null, null).innerHTML = "你可以重新选择队友开始新的一轮征程,也可以用当前的队伍继续.";
    P("p", b, null, null).innerHTML = "重新开始征程你将获得以下加成:";
    var c = w.i.wh,
    d = NA(c),
    f = Math.min(40, c),
    g = Math.min(aw, c),
    h;
    for (h = 0; h < d.length; h++) P("p", b, null, "gameOverBonus").innerHTML = "解锁角色职业:" + d[h];
    c <= aw && (P("p", b, null, "gameOverBonus").innerHTML = "背包大小加成:" + g);
    P("p", b, null, "gameOverBonus").innerHTML = "技能点加成:" + f;
    b = P("div", a, null, "gameOverBlurb");
    b = P("div", b, null, "upgradeButton");
    b.style.padding = "15px";
    b.style.textAlign = "center";
    b.innerHTML = "重生 - 以1级的队伍重新开始游戏.";
    b.onclick = function() {
        w.Fe = !1;
        Ta("Victory", "Decision: Prestige");
        w.OA()
    };
    a = P("div", a, null, "gameOverBlurb");
    a = P("div", a, null, "upgradeButton");
    a.style.padding = "15px";
    a.style.textAlign = "center";
    a.innerHTML = "继续 - 用你当前的队伍征服新的城堡.";
    a.onclick = function() {
        w.Fe = !1;
        Ta("Victory", "Decision: Continue");
        w.wE();
        w.i.Bg.nm++;
        cg();
        cd();
        w.$h.J();
        w.Ee.J();
        px(w.pg)
    }
}
function NA(a) {
    var b = [],
    c;
    for (c = 0; c < av.length; c++) av[c].Le === a && b.push(av[c].Ka);
    return b
}
function MA(a) {
    var b = P("table", a, null, "gameOverTableTopRow").insertRow(0),
    c;
    for (c = 0; 19 > c; c++) OA(b.insertCell(c));
    c = P("table", a, null, "gameOverTableTopRow");
    c.style.top = "41px";
    b = c.insertRow(0);
    for (c = 0; 19 > c; c++) OA(b.insertCell(c));
    c = P("table", a, null, "gameOverTableBottomRow");
    c.style.bottom = "41px";
    b = c.insertRow(0);
    for (c = 0; 19 > c; c++) OA(b.insertCell(c));
    a = P("table", a, null, "gameOverTableBottomRow").insertRow(0);
    for (c = 0; 19 > c; c++) OA(a.insertCell(c))
}
function OA(a) {
    var b = aa[k(aa.length)],
    b = w.fh.v(b.a);
    a = P("img", a, null, "characterImage");
    a.src = "images/Transparent.gif";
    a.style.background = "url('spritesheet/monsters.png') -" + b.ub + "px -" + (b.vb + 10) + "px";
    a.style.height = "30px";
    a.style.width = "52px"
};
function PA(a) {
    this.F = "offlineTabContent";
    this.C = a;
    this.$l = this.pb = null;
    this.gu = 500;
    this.Jh = -1;
    this.Mt = this.aj = this.$t = this.vm = this.Vm = this.Um = this.Tm = this.Qw = null;
    this.yu = this.Kk = this.Bu = this.Ck = this.Hk = this.Fk = this.Ek = this.vv = this.wy = this.JB = this.Iy = this.Fz = this.sA = this.nA = this.mA = this.HA = -1
}
PA.prototype = new jy;
e = PA.prototype;
e.Me = function() {
    this.C.qa = !1;
    this.C.ha = !1
};
e.Zd = function() {
    var a = this.C;
    a.qa = !0;
    a.ha = !0;
    this.Jh = -1;
    a = w.i.Ih;
    this.HA = a.si;
    this.mA = a.Gi;
    this.nA = a.Ph;
    this.sA = a.Mj;
    this.Fz = a.wi;
    this.Iy = w.kb.Jg.length;
    this.JB = a.oj;
    this.wy = w.i.Ig.Ze.length;
    this.yu = this.Kk = this.Bu = this.Ck = this.Hk = this.Fk = this.Ek = this.vv = -1
};
e.Ne = function() {
    var a = this.C;
    a.qa = !1;
    a.ha = !1;
    this.$l && (Ox(this.F), this.Mt = this.aj = this.$t = this.vm = this.Vm = this.Um = this.Tm = this.Qw = this.pb = this.$l = null)
};
e.J = function() {
    this.C.qa = !1
};
e.ba = function() {
    this.$l || QA(this);
    var a = Math.min(1, w.Vj / w.jf),
    a = this.gu * a;
    this.Jh != a && (this.Jh = a, this.pb.style.width = a + "px");
    var b = w.i.Ih,
    a = b.si - this.HA,
    c = b.Gi - this.mA,
    d = b.Ph - this.nA,
    f = b.Mj - this.sA,
    g = b.wi - this.Fz,
    h = w.kb.Jg.length - this.Iy,
    b = b.oj - this.JB,
    l = w.i.Ig.Ze.length - this.wy;
    this.vv != a && (this.vv = a, this.Qw.innerHTML = r(a));
    this.Ek != c && (this.Ek = c, this.Tm.innerHTML = r(c));
    this.Fk != d && (this.Fk = d, this.Um.innerHTML = r(d));
    this.Hk != f && (this.Hk = f, this.Vm.innerHTML = r(f));
    this.Ck != g && (this.Ck = g, this.vm.innerHTML = r(g));
    this.Bu != h && (this.Bu = h, this.$t.innerHTML = r(h));
    this.Kk != b && (this.Kk = b, this.aj.innerHTML = r(b));
    this.yu != l && (this.yu = l, this.Mt.innerHTML = r(l))
};
function QA(a) {
    var b = M(a.F);
    Px(b);
    var c = P("div", b, null, "offlineHeader"),
    d = a.Er(m(w.jf / 36E5), m(w.jf / 6E4 % 60), m(w.jf / 1E3 % 60));
    P("div", c, null, "offlineTitleText").innerHTML = "末日危机2";
    P("div", c, null, "offlineSubHeader").innerHTML = "离线:" + d;
    P("div", c, null, "offlineSubHeader").innerHTML = "正在清算你离开时发生了什么...";
    c = P("div", b, null, "offlineProgressBarContainer");
    c = P("div", c, null, "offlineProgressBar");
    a.pb = P("div", c, null, "offlineProgressSlider");
    c = P("div", b, null, "offlineProgressStatsContainer");
    a.fr(c);
    b = P("div", b, null, "offlineCancelButtonContainer");
    a.$l = P("div", b, null, "offlineCancelButton");
    a.$l.innerHTML = "跳过这个.我只是想杀杀怪物.";
    a.$l.onclick = function() {
        w.xu()
    }
}
e.fr = function(a) {
    a = P("table", a, null, "centeredElement");
    var b = 0;
    this.Qw = this.V(a, "杀死怪物", b++);
    this.Tm = this.V(a, "找到道具", b++);
    this.Um = this.V(a, "卖出道具", b++);
    this.Vm = this.V(a, "清理关卡", b++);
    this.vm = this.V(a, "清理地牢", b++);
    this.$t = this.V(a, "攻击城堡", b++);
    this.aj = this.V(a, "昏迷次数", b++);
    this.Mt = this.V(a, "成就", b)
};
e.V = function(a, b, c) {
    a = a.insertRow(c);
    c = a.insertCell(0);
    c.className = "statisticsTableLabel";
    c.innerHTML = b;
    b = a.insertCell(1);
    b.style.textAlign = "right";
    b.style.width = "70px";
    return b
};
e.Er = function(a, b, c) {
    return (10 > a ? "0": "") + a + ":" + (10 > b ? "0": "") + b + ":" + (10 > c ? "0": "") + c
};
function RA(a) {
    this.F = a;
    this.Ya = !0;
    this.Ot = this.Nt = this.Hq = this.Iq = null;
    this.Uc = [];
    this.Vc = [];
    this.Nf = [];
    this.QC = "achievementsHeaderSpan";
    this.pz = -1
}
RA.prototype = new Xx;
RA.prototype.J = function() {
    this.uo()
};
RA.prototype.uo = function() {
    Ox(this.F);
    this.Iq = null;
    this.Uc.length = 0;
    this.Vc.length = 0;
    this.Nf.length = 0;
    this.Zn();
    var a = this.F,
    b = M(a);
    if (b) {
        this.Iq = P("table", b, null, "adventurerSkillTreeTable");
        var b = this.Hq.Ha,
        c = this.Nt.Ha,
        d = this.Ot.Ha,
        f = Math.max(b.length, Math.max(c.length, d.length)),
        g,
        h,
        l,
        n;
        for (g = 0; g < f; g++) h = this.Iq.insertRow(g),
        l = h.insertCell(0),
        n = h.insertCell(1),
        h = h.insertCell(2),
        l.id = a + "_" + g + "_0",
        n.id = a + "_" + g + "_1",
        h.id = a + "_" + g + "_2",
        l.width = 150,
        n.width = 150,
        h.width = 150,
        g < b.length && this.Uc.push(new ky(l.id, b[g], g, !0)),
        g < c.length && this.Vc.push(new ky(n.id, c[g], g, !0)),
        g < d.length && this.Nf.push(new ky(h.id, d[g], g, !0))
    }
    for (a = 0; a < this.Uc.length; a++) this.Uc[a].J();
    for (a = 0; a < this.Vc.length; a++) this.Vc[a].J();
    for (a = 0; a < this.Nf.length; a++) this.Nf[a].J()
};
RA.prototype.Zn = function() {
    var a = w.i.Ig.jj,
    b = [],
    c = [],
    d = [],
    f;
    for (f = 0; f < a.length; f += 3) b.push(new Ms(a[f])),
    f + 1 < a.length && (c.push(new Ms(a[f + 1])), f + 2 < a.length && d.push(new Ms(a[f + 2])));
    this.Hq = new is([b], !1);
    this.Nt = new is([c], !1);
    this.Ot = new is([d], !1)
};
RA.prototype.ba = function() {
    this.Hq && this.Iq || this.uo();
    ls(this.Hq);
    ls(this.Nt);
    ls(this.Ot);
    var a;
    for (a = 0; a < this.Uc.length; a++) this.Uc[a].Xa();
    for (a = 0; a < this.Vc.length; a++) this.Vc[a].Xa();
    for (a = 0; a < this.Nf.length; a++) this.Nf[a].Xa();
    var b = w.i.Ig;
    a = b.jj.length;
    b = b.Ze.length + (a - b.ik.length);
    this.pz != b && (this.pz = b, Ux(this.QC, "成就(" + b + "/" + a + ")"))
};
function SA() {
    this.F = "pointsBreakdownContainer";
    this.Ya = !0;
    this.Ls = null;
    this.Ao = {};
    this.sz = {};
    this.Dv = {};
    this.sy = {};
    this.tu = {};
    this.ex = {}
}
SA.prototype = new Xx;
SA.prototype.J = function() {
    this.Ao = {};
    this.sy = {};
    this.tu = {};
    this.ex = {};
    var a, b;
    for (a = 0; a < Qr.length; a++) b = Qr[a].h,
    this.Ao[b] = -1,
    this.sz[b] = -1,
    this.Dv[b] = -1;
    TA(this)
};
SA.prototype.ba = function() {
    this.Ls || TA(this);
    var a, b, c, d, f, g, h, l, n = w.i.ae;
    for (a = 0; a < Qr.length; a++) b = Qr[a].h,
    c = this.Ao[b],
    d = n.Qi[b],
    f = this.Ao[b],
    g = n.pj[b],
    h = this.Dv[b],
    l = Qr[a].Fb,
    c != d && (this.Ao[b] = d, c = this.sy[b], c.innerHTML = xa(d)),
    f != g && (this.sz[b] = g, d = this.tu[b], d.innerHTML = r(g)),
    h != l && (this.Dv[b] = l, b = this.ex[b], b.innerHTML = r(l))
};
function TA(a) {
    Ox(a.F);
    a.Ls = P("table", M(a.F), null, "pointsTable");
    var b = 0;
    a.St(b++);
    var c;
    for (c = 0; c < Qr.length; c++) {
        var d = a,
        f = Qr[c].h,
        g = b++,
        g = d.Ls.insertRow(g),
        h = g.insertCell(0);
        h.style.textAlign = "right";
        h.style.width = "120px";
        h.innerHTML = Pr[f].Gc;
        h = g.insertCell(1);
        h.style.textAlign = "right";
        h.style.width = "60px";
        d.tu[f] = h;
        h = g.insertCell(2);
        h.style.textAlign = "right";
        h.style.width = "60px";
        d.ex[f] = h;
        g = g.insertCell(3);
        g.style.textAlign = "right";
        d.sy[f] = g
    }
}
SA.prototype.St = function(a) {
    a = this.Ls.insertRow(a);
    var b = Vx(a);
    b.style.textAlign = "right";
    b.innerHTML = "冒险行动";
    b = Vx(a);
    b.style.textAlign = "right";
    b.innerHTML = "计数";
    b = Vx(a);
    b.style.textAlign = "right";
    b.innerHTML = "AP/行动";
    a = Vx(a);
    a.style.textAlign = "right";
    a.innerHTML = "冒险点数"
};
function UA(a) {
    this.F = a;
    this.Ya = !0;
    this.Rl = this.hj = this.Gt = null;
    this.Uc = [];
    this.Vc = []
}
UA.prototype = new Xx;
UA.prototype.J = function() {
    this.uo()
};
UA.prototype.uo = function() {
    Ox(this.F);
    this.Gt = null;
    this.Uc.length = 0;
    this.Vc.length = 0;
    this.Zn();
    var a = this.F,
    b = M(a);
    if (b) {
        this.Gt = P("table", b, null, "adventurerSkillTreeTable");
        var b = this.hj.Ha,
        c = this.Rl.Ha,
        d = Math.max(b.length, c.length),
        f,
        g,
        h;
        for (f = 0; f < d; f++) g = this.Gt.insertRow(f),
        h = g.insertCell(0),
        g = g.insertCell(1),
        h.id = a + "_" + f + "_0",
        g.id = a + "_" + f + "_1",
        h.width = 150,
        g.width = 150,
        f < b.length && this.Uc.push(new ky(h.id, b[f], f, !0)),
        f < c.length && this.Vc.push(new ky(g.id, c[f], f, !0))
    }
    for (a = 0; a < this.Uc.length; a++) this.Uc[a].J();
    for (a = 0; a < this.Vc.length; a++) this.Vc[a].J()
};
UA.prototype.Zn = function() {
    var a = w.i.ae.tl,
    b = [],
    c = [],
    d;
    for (d = 0; d < a.length; d += 2) b.push(a[d]),
    d + 1 < a.length && c.push(a[d + 1]);
    this.hj = new is([b], !1);
    this.Rl = new is([c], !1)
};
UA.prototype.ba = function() {
    this.hj && this.Gt || this.uo();
    ls(this.hj);
    ls(this.Rl);
    var a;
    for (a = 0; a < this.Uc.length; a++) this.Uc[a].Xa();
    for (a = 0; a < this.Vc.length; a++) this.Vc[a].Xa()
};
function VA(a) {
    this.F = "pointsTabContent";
    this.C = a;
    R(this, new fz("achievementsTabAdventurePointsPanel"));
    R(this, new SA);
    R(this, new UA("pointUpgradesContainer"));
    R(this, new RA("achievementsContainer"))
}
VA.prototype = new jy;
VA.prototype.Me = function() {
    this.C.qa = !0;
    this.C.ha = !1
};
VA.prototype.Ne = function() {
    this.C.qa = !0;
    this.C.ha = !1
};
VA.prototype.Zd = function() {
    this.C.qa = !1;
    this.C.ha = !1
};
VA.prototype.J = function() {
    this.C.qa = !0;
    this.C.ha = !1;
    Zx(this)
};
function WA(a) {
    var b = a.op.RD,
    c = a.r,
    d = a.pa,
    f = a.Ew,
    g = a.uf(),
    h = a.Rm;
    return {
        itemTypeId: b,
        itemSlot: c,
        characterClass: d,
        itemName: f,
        itemRarity: g,
        itemLevel: a.ns,
        itemGold: a.zf,
        itemValue: a.va,
        itemCharacteristic: a.s,
        itemEffect: h ? {
            itemEffectType: h.Dw,
            itemEffectAmount: h.LD,
            itemEffectDescription: h.MD,
            itemEffectName: h.ms
        }: null
    }
}
function XA(a) {
    var b = a.itemSlot,
    c = a.characterClass,
    d = a.itemName,
    f = a.itemRarity,
    g = a.itemLevel,
    h = a.itemGold,
    l = a.itemValue,
    n = a.itemCharacteristic,
    p;
    if (p = a.itemEffect) {
        var s = p.itemEffectType,
        u = p.itemEffectDescription;
        p = s && u ? new Fv(s, p.itemEffectAmount, u, p.itemEffectName) : null
    } else p = null;
    a = w.Sm.os[a.itemTypeId];
    return a ? new Iv(a, b, c, d ? d: "Error", g ? g: 1, f ? f: 0, h ? h: 0, l ? l: 0, n ? n: 1, p) : (console.log("failed to lookup item type"), null)
};
function YA(a) {
    var b = a.Xt,
    c = a.pa,
    d = a.zb,
    f = a.v().getName(),
    g;
    g = a.K;
    g = {
        characterLevel: g.Eb,
        characterHealth: g.Sa,
        characterSpirit: g.Yc,
        kills: g.im,
        damageComponent: ZA(g.sd),
        armorComponent: ZA(g.je),
        attackRatingComponent: ZA(g.xe),
        defenceRatingComponent: ZA(g.Ae),
        maxHealthComponent: ZA(g.Jb),
        maxSpiritComponent: ZA(g.Ke),
        stunCount: g.vq,
        minionKills: g.Ff,
        damageGiven: g.rj,
        damageReceived: g.sj
    };
    var h;
    h = a.p;
    var l = h.w,
    n = h.cd;
    h = {
        levelX: h.Ob(),
        levelY: h.Pb(),
        worldX: h.dc(),
        worldY: h.ec(),
        roomId: l ? l.fk: -1,
        floorPositionIndex: h.fg,
        hallwayId: n ? n.Or: -1
    };
    var n = a.gk,
    l = [],
    p;
    if (n) for (p = 0; p < n.length; p++) l.push({
        spellName: n[p].ta
    });
    p = a.Ld;
    n = [];
    if (p) {
        p = p.items;
        var s;
        for (s = 0; s < p.length; s++) n.push(WA(p[s]))
    }
    p = a.Z;
    s = a.Yg;
    var u = [];
    if (s && p) {
        var y, A;
        for (A = 0; A < p.length; A++)(y = s.ef(p[A])) && u.push(WA(y))
    } else console.log("failed to generate equipped item state array");
    return {
        adventurerName: b,
        characterClass: c,
        characterType: d,
        spriteName: f,
        characteristicsComponent: g,
        positionComponent: h,
        spells: l,
        inventory: n,
        equippedItemCollection: u,
        skillPoints: a.de,
        initialSpellSkillPoint: a.Ci,
        upgrades1: $A(a.ei.Ha),
        upgrades2: $A(a.fi.Ha),
        upgrades3: $A(a.gi.Ha),
        upgrades4: $A(a.hi.Ha)
    }
}
function $A(a) {
    var b = {},
    c, d;
    for (d = 0; d < a.length; d++) c = a[d],
    b[c.Jr().c] = c.He();
    return b
}
function aB(a, b) {
    var c, d, f;
    for (c = 0; c < a.length; c++) f = a[c],
    d = a[c].Jr(),
    d = b[d.c],
    f.ft(d)
}
function ZA(a) {
    return a ? {
        itemValue: a.va,
        levelValue: a.Pc,
        spellBonusPercent: a.Xh,
        skillBonusPercent: a.wc
    }: null
}
function bB(a, b) {
    if (a && b) {
        var c = b.itemValue,
        d = b.levelValue,
        f = b.spellBonusPercent,
        g = b.skillBonusPercent;
        a.va = c ? c: 0;
        a.Pc = d ? d: 0;
        a.Xh = f ? f: 0;
        a.wc = g ? g: 0
    }
};
function cB() {}
cB.prototype.Kw = function(a) {
    var b = w.ob;
    b.hd = a.minUnlockedLevel;
    b.fc = a.maxUnlockedLevel;
    a = a.monsterLevelStates;
    for (b = 0; b < a.length; b++) {
        for (var c = a[b], d = c.level, c = c.monsterTypes, f = [], g = void 0, g = 0; g < c.length; g++) f.push(dB(c[g], d));
        w.ob.en[d + ""] = f
    }
};
function eB(a, b) {
    var c = [],
    d;
    for (d = 0; d < b.length; d++) c.push(fB(b[d]));
    return {
        level: a,
        monsterTypes: c
    }
}
function fB(a) {
    return {
        name: a.Vk(),
        sprite: a.ll.getName(),
        kills: a.xq
    }
}
function dB(a, b) {
    var c = a.kills,
    d = new fi(a.name, a.sprite, b),
    c = c ? c: 0;
    d.xq = 0;
    d.ml = 0;
    d.Sj = 0;
    d.Ep = 0;
    d.Gp = 0;
    d.Fp = 0;
    d.Hp = 0;
    d.No = 0;
    d.$o = 0;
    d.ek = 0;
    ti(d);
    for (d.xq = c; c > d.ek;) c -= d.ek,
    ti(d);
    d.ml = c;
    return d
};
function gB() {}
gB.prototype.ts = function(a) {
    var b = a.count,
    c = a.locked,
    d = a.upgradeCount;
    if (a = w.nh.vf(a.scrollId)) a.mh = b,
    a.ts(c, d)
};
function hB(a) {
    return {
        playedMillis: a.Xj,
        turnCount: a.On,
        doorsOpened: a.Lk,
        roomsCleared: a.qn,
        levelsCleared: a.Mj,
        dungeonsCleared: a.wi,
        castlesConquered: a.uk,
        farmsPurchased: a.Rk,
        totalGoldFromMonsters: a.Xk,
        totalGoldFromItems: a.Wk,
        directKills: a.si,
        scrollKills: a.Dl,
        minionKills: a.Ff,
        farmedKills: a.Sd,
        characterStunnedCount: a.oj,
        meleeAttackCount: a.hl,
        rangedAttackCount: a.wl,
        spellCastCount: a.Gl,
        potionsUsed: a.ul,
        scrollsUsed: a.El,
        minionsSummoned: a.kl,
        itemsSold: a.Ph,
        itemsFound: a.Gi,
        uncommonItemsFound: a.Ol,
        rareItemsFound: a.xl,
        historicItemsFound: a.Zk,
        ancientItemsFound: a.nk,
        treasureChestsLooted: a.Nl,
        weaponRacksLooted: a.Sl,
        bookcasesLooted: a.tk
    }
}
function iB(a, b, c) {
    var d = a.totalPlayedMillis,
    f = a.playedMillis,
    g = a.turnCount,
    h = a.doorsOpened,
    l = a.roomsCleared,
    n = a.levelsCleared,
    p = a.dungeonsCleared,
    s = a.castlesConquered,
    u = a.farmsPurchased,
    y = a.totalGoldFromMonsters,
    A = a.totalGoldFromItems,
    C = a.directKills,
    v = a.scrollKills,
    D = a.minionKills,
    N = a.farmedKills,
    I = a.characterStunnedCount,
    x = a.meleeAttackCount,
    z = a.rangedAttackCount,
    O = a.spellCastCount,
    J = a.potionsUsed,
    la = a.scrollsUsed,
    Q = a.minionsSummoned,
    V = a.itemsSold,
    na = a.itemsFound,
    K = a.uncommonItemsFound,
    H = a.rareItemsFound,
    S = a.historicItemsFound,
    da = a.ancientItemsFound,
    W = a.treasureChestsLooted,
    ia = a.weaponRacksLooted,
    ea = a.weaponsRacksLooted;
    a = a.bookcasesLooted;
    u || (u = w.Aa.dg.length);
    b.Xj = c ? Math.max(0, d ? d: f) : Math.max(0, f ? f: 0);
    b.On = g ? g: 0;
    b.Lk = h ? h: 0;
    b.qn = l ? l: 0;
    b.Mj = n ? n: 0;
    b.wi = p ? p: 0;
    b.uk = s ? s: 0;
    b.Rk = u;
    b.Xk = y ? y: 0;
    b.Wk = A ? A: 0;
    b.si = C ? C: 0;
    b.Dl = v ? v: 0;
    b.wx(D ? D: 0);
    b.dt(N ? N: 0);
    b.oj = I ? I: 0;
    b.hl = x ? x: 0;
    b.wl = z ? z: 0;
    b.Gl = O ? O: 0;
    b.ul = J ? J: 0;
    b.El = la ? la: 0;
    b.kl = Q ? Q: 0;
    b.Ph = V ? V: 0;
    b.Gi = na ? na: 0;
    b.Ol = K ? K: 0;
    b.xl = H ? H: 0;
    b.Zk = S ? S: 0;
    b.nk = da ? da: 0;
    b.Nl = W ? W: 0;
    b.tk = a ? a: 0;
    c = Math.max(ia ? ia: 0, ea ? ea: 0);
    b.Sl = c
};
function jB() {
    var a = w.pg;
    persistence.remove();
    a.qs = Ba();
    Ta("SaveManager", "Delete")
}
function px(a) {
    var b = vz(a);
    b && (persistence.write(b), a.qs = Ba())
}
function kB(a, b) {
    if (b) {
        var c = fa.eD(b);
        if (c) {
            var d = JSON.parse(c);
            if (d) {
                w.ix(!0);
                w.Em = d.gameInitialized;
                if (w.Em) {
                    w.wb = d.worldActive;
                    w.lg = d.partyCreated;
                    w.Fe = d.gameWon;
                    var f = d.gameTimestamp;
                    w.Tw = f ? f: Date.now();
                    var g = d.turnNumber,
                    h = d.frameNumber,
                    l = d.victoryCount;
                    w.i.$a = g ? g: 0;
                    w.i.Gj = h ? h: 0;
                    w.i.wh = l ? l: 0;
                    var n = d.statistics,
                    p = d.totalStatistics,
                    s = d.world,
                    u = s.worldCenterX,
                    y = s.worldCenterY,
                    A = s.blockShiftRow,
                    C = w.S;
                    C.R = s.blockShiftCol;
                    C.L = A;
                    C.q = bg(C);
                    ed(C);
                    C.he = u;
                    C.ie = y;
                    C.ty = !0;
                    var v = d.dungeonManagerState,
                    D = v.farmedKills,
                    N = v.dungeonCostLevel,
                    I = v.dungeonStates;
                    if (I) {
                        w.Aa.lt = !1;
                        var x;
                        for (x = 0; x < I.length; x++) {
                            var z = I[x];
                            if (z) {
                                var O = z.dungeonId,
                                J = z.discovered,
                                la = z.cleared,
                                Q = z.conquered,
                                V = z.clearedTurn,
                                na = z.dungeonFarm,
                                K = z.farmStartTurn,
                                H = z.dungeonFarmCost,
                                S = z.dungeonType,
                                da = z.levelCount;
                                if (O) {
                                    var W = w.Aa.Do[O];
                                    if (W) {
                                        W.Lc = la ? !0 : !1;
                                        W.Mg = V ? V: 0;
                                        W.qf = J ? !0 : !1;
                                        W.oe = na ? !0 : !1;
                                        W.tx(Q ? !0 : !1);
                                        W.zi = K ? K: 0;
                                        W.Nk = H;
                                        var ia = S ? S: 0;
                                        W.Go = ia;
                                        W.Aj = !(4 === ia || 5 === ia || 7 === ia || 8 === ia);
                                        W.Fo = Fd(ia);
                                        W.rs = da;
                                        J && (ee(W), na ? he(W) : la && w.Aa.Is(W))
                                    } else console.log("Failed to load dungeon state for: " + O)
                                }
                            }
                        }
                        w.Aa.lt = !0;
                        var ea = w.Aa;
                        ea.lt && (fe(ea, ea.uj), fe(ea, ea.Ge), fe(ea, ea.ze), fe(ea, ea.dg), fe(ea, ea.bk))
                    }
                    w.Aa.dt(D ? D: 0);
                    w.Aa.Mk = N ? N: 0;
                    var va = d.currentDungeon;
                    if (va) {
                        var yb = va.dungeonId,
                        Fb = va.currentLevelIndex,
                        pa = w.Aa.Do[yb];
                        pa ? (pa.ri = Fb, w.Mc = pa) : (console.log("Failed to lookup dungeon by id: " + yb), w.Mc = null)
                    } else w.Mc = null;
                    var T = d.castleManager;
                    if (T) {
                        var X = T.castleStates;
                        w.kb.Uj = T.nextRequiredMonsterLevel;
                        var Ca;
                        for (Ca = 0; Ca < X.length; Ca++) {
                            var qa = X[Ca];
                            if (qa) {
                                var ta = qa.castleId,
                                eb = qa.conquered,
                                Gb = qa.dungeonsConquered,
                                Da = qa.castleRegionLocked,
                                ub = qa.attackScheduled,
                                mb = qa.requiredMonsterLevel;
                                if (ta) {
                                    var Ea = w.kb.bm[ta];
                                    Ea ? (Ea.tx(eb ? !0 : !1), Ea.Bj = Gb ? !0 : !1, Ea.$b = Da ? !0 : !1, Ea.ye = ub ? !0 : !1, Lc(), Ea.Jf = mb ? mb: 0) : console.log("Failed to load castle state for: " + ta)
                                }
                            }
                        }
                        var La = w.kb,
                        wa, Fa;
                        for (wa = 0; wa < La.pd.length; wa++) Fa = La.pd[wa],
                        Jc(Fa) && La.Jg.push(Fa),
                        Fa.ye && !Fa.cb && La.Dh.push(Fa),
                        Kc(Fa);
                        md(La, La.Dh);
                        md(La, La.Jg);
                        var ha = w.Aa,
                        ja;
                        for (ja = 0; ja < ha.Ab.length; ja++) ge(ha, ha.Ab[ja])
                    }
                    var Ga = d.currentCastle;
                    if (Ga) {
                        var bb = Ga.castleId,
                        za = w.kb.bm[bb];
                        za ? w.le = za: (console.log("Failed to lookup castle by id: " + bb), w.le = null)
                    } else w.le = null;
                    var nb = d.shopManager,
                    fb = 0;
                    nb && (fb = nb.collectedGold);
                    w.ug.ni = fb ? fb: 0;
                    var cb = d.farms;
                    if (cb) {
                        var Ua;
                        for (Ua = 0; Ua < cb.length; Ua++) {
                            var Va = cb[Ua];
                            if (Va) {
                                var mc = Va.dungeonId,
                                vb = Va.farmCol,
                                Sb = Va.farmRow;
                                mc && le(w.Bm, new ie(mc, vb, Sb))
                            }
                        }
                    }
                    var Ma = d.level;
                    if (Ma && !w.wb) {
                        var zb, Hb;
                        w.Mc ? (zb = w.Mc.Go, Hb = w.Mc.Aj) : (zb = 11, Hb = !1);
                        var ac = Ma.levelCenterX,
                        ob = Ma.levelCenterY,
                        pb = Ma.roomVisibility,
                        Ha = Ma.hallways;
                        Jd(Ma.levelSeed, zb, Hb, !1);
                        var jb = w.Ba;
                        jb.Ki = ac;
                        jb.Li = ob;
                        var Ab, Bb = w.Ba.gd;
                        if (Bb.length !== Ha.length) console.log("hallway array length mismatch. state=" + Ha.length + " hallways=" + Bb.length);
                        else for (Ab = 0; Ab < Ha.length; Ab++) {
                            var qb = Bb[Ab],
                            wb = Ha[Ab],
                            Ib = wb.doorAOpen,
                            Ec = wb.doorBOpen;
                            Mg(qb, wb.visible);
                            qb.af.Mb = Ib;
                            qb.Be.Mb = Ec
                        }
                        var bc, Wa = w.Ba.Pa;
                        if (Wa.length !== pb.length) console.log("room array length mismatch");
                        else for (bc = 0; bc < pb.length; bc++) pb[bc] && Ag(Wa[bc])
                    }
                    var cc = d.treasureChestManager;
                    if (cc) {
                        var Qa, nc;
                        for (Qa = 0; Qa < cc.length; Qa++) {
                            var sa = cc[Qa],
                            Tb = sa.levelX,
                            qc = sa.levelY,
                            Fc = sa.opened,
                            Cb = sa.westWall,
                            kb = sa.roomId,
                            Ra;
                            b: {
                                for (var Ja = sa.settingsId,
                                Db = w.th,
                                gb = void 0,
                                gb = 0; gb < Db.ve.length; gb++) if (Db.ve[gb].uh === Ja) {
                                    Ra = Db.ve[gb];
                                    break b
                                }
                                console.log("failed to find treasure chest settings: " + Ja);
                                Ra = Db.ve[0]
                            }
                            var rb = new Gi(Tb, qc, oh(kb), Ra, Cb);
                            Hi(rb, Fc);
                            if (nc = rb) {
                                var dc = w.th,
                                Ka = nc;
                                dc.Mn.push(Ka);
                                dc.Dt[Ka.Nn.fk] = Ka
                            }
                        }
                    }
                    var Xa = d.party;
                    if (Xa) {
                        var hb = w.i.da,
                        lb = Xa.gold,
                        rc = Xa.kills,
                        sc = Xa.experiencePoints;
                        hb.fd = lb ? lb: 0;
                        hb.Je = rc ? rc: 0;
                        hb.cg = sc ? sc: 0
                    }
                    var Aa = d.gameOptions;
                    if (Aa) {
                        var db = w.Nb,
                        Mc = Aa.infoTextVisible,
                        ec = Aa.spellEffectsVisible,
                        Ub = Aa.mapOverlayVisible,
                        sb = Aa.offlineProcessingEnabled,
                        ka = Aa.fpsVisible,
                        Eb;
                        Eb = void 0 === Aa.inactiveTabProcessingEnabled ? !0 : Aa.inactiveTabProcessingEnabled;
                        var xb;
                        xb = void 0 === Aa.spriteRenderOrderEnabled ? !0 : Aa.spriteRenderOrderEnabled;
                        db.Mm = !!Mc;
                        db.nq = !!ec;
                        db.up = !!Ub;
                        db.Jp = !!sb;
                        db.bp = !!Eb;
                        db.rq = !!xb;
                        db.Po = !!ka
                    }
                    n && iB(n, w.i.Ih, !1);
                    p ? iB(p, w.i.Ua, !1) : n && iB(n, w.i.Ua, !0);
                    var Na = d.victoryStatistics;
                    if (Na) {
                        var Ya = w.i.Bg,
                        tc = Na.partySize1Victories,
                        me = Na.partySize2Victories,
                        ne = Na.partySize3Victories,
                        Le = Na.maxContinuationVictories,
                        Td = Na.currentContinuationVictories,
                        oe = Na.singleClassVictories,
                        Y = Na.classVictories,
                        nf = Na.soloClassVictories,
                        Nc = Na.currentContinueCount;
                        Ya.hn = tc ? tc: 0;
                        Ya.jn = me ? me: 0;
                        Ya.kn = ne ? ne: 0;
                        Ya.Xm = Le ? Le: 0;
                        Ya.mm = Td ? Td: 0;
                        Ya.vn = oe ? oe: 0;
                        void 0 === Nc && (Nc = Ya.mm);
                        Ya.nm = Nc;
                        if (Y) {
                            var gd, uc, U;
                            for (U = 0; U < av.length; U++) gd = av[U].pa,
                            (uc = Y[gd]) && (w.i.Bg.qo[gd] = uc)
                        }
                        if (nf) {
                            var Z, $, ba;
                            for (ba = 0; ba < av.length; ba++) Z = av[ba].pa,
                            ($ = nf[Z]) && (w.i.Bg.lq[Z] = $)
                        }
                    }
                    var ca = d.adventurers;
                    if (ca) {
                        var q, pe;
                        for (q = 0; q < ca.length; q++) {
                            var fc = ca[q],
                            vd = fc.characterClass,
                            qe = fc.spriteName,
                            gc = fc.characteristicsComponent,
                            vc = fc.positionComponent,
                            $c = fc.spells,
                            Gc = fc.inventory,
                            ad = fc.equippedItemCollection,
                            Vb = fc.skillPoints,
                            Tc = fc.initialSpellSkillPoint,
                            hd = fc.upgrades1,
                            id = fc.upgrades2,
                            jd = fc.upgrades3,
                            kd = fc.upgrades4,
                            eg = $u[vd],
                            hc = new Uh(fc.adventurerName, fc.characterType, vd, eg, new Zv),
                            re = hi(eg.nb());
                            hc.Fh = re;
                            hc.ee = w.fh.v(qe);
                            var of = hc;
                            of.de = Vb ? Vb: 0;
                            of.Zi = ws(of);
                            hc.Ci = Tc ? Tc: 0;
                            var wd = hc.p,
                            rl = vc.worldX,
                            cj = vc.worldY,
                            Ah = vc.roomId,
                            dj = vc.hallwayId,
                            Bh = vc.floorPositionIndex;
                            t(wd.u, vc.levelX, vc.levelY);
                            t(wd.Db, rl, cj); - 1 < Ah && (wd.w = oh(Ah));
                            if ( - 1 < dj) {
                                var Me;
                                b: {
                                    for (var Ne = w.Ba,
                                    Oe = void 0,
                                    Oe = 0; Oe < Ne.gd.length; Oe++) if (Ne.gd[Oe].Or === dj) {
                                        Me = Ne.gd[Oe];
                                        break b
                                    }
                                    Me = null
                                }
                                wd.cd = Me;
                                wd.fg = Bh
                            }
                            var fg = hc,
                            ld = $c;
                            if (ld) for (var pf = void 0,
                            qf = void 0,
                            pf = 0; pf < ld.length; pf++) {
                                var rf = fg.Kc.kc,
                                sf = void 0;
                                if (rf) {
                                    c: {
                                        var Ch = ld[pf].spellName,
                                        gg = void 0,
                                        se = void 0;
                                        for (se in rf) if (Object.prototype.hasOwnProperty.call(rf, se)) if (gg = rf[se], !gg) console.log("spell lookup failure for key: " + se);
                                        else if (gg.ta === Ch) {
                                            sf = gg;
                                            break c
                                        }
                                        console.log("failed to lookup spell: " + Ch);
                                        sf = null
                                    }
                                    qf = sf ? new li(sf) : null
                                } else qf = null;
                                qf && ki(fg, qf)
                            }
                            var Md = hc.Ld,
                            tf = Gc;
                            if (tf) for (var uf = void 0,
                            Dh = void 0,
                            uf = 0; uf < tf.length; uf++)(Dh = XA(tf[uf])) && bw(Md, Dh);
                            var ej = hc,
                            hg = ad;
                            if (hg) for (var ig = void 0,
                            Eh = void 0,
                            ig = 0; ig < hg.length; ig++)(Eh = XA(hg[ig])) && $w(ej, Eh);
                            var Sa = hc.K,
                            bd = gc.characterLevel,
                            Fh = gc.characterHealth,
                            Gh = gc.characterSpirit,
                            Hh = gc.kills,
                            Ih = gc.damageComponent,
                            fj = gc.armorComponent,
                            vf = gc.attackRatingComponent,
                            wf = gc.defenceRatingComponent,
                            Jh = gc.maxHealthComponent,
                            te = gc.maxSpiritComponent,
                            Ud = gc.stunCount,
                            xf = gc.minionKills,
                            yf = gc.damageGiven,
                            xd = gc.damageReceived;
                            Sa.Eb = bd ? bd: 1;
                            var sl = Ia(Sa.Eb, rx, 1);
                            Sa.Am = sl;
                            var Kh = Ia(Sa.Eb, ux, 1);
                            Sa.mt = Kh;
                            Sa.Sa = m(Fh ? Fh: Sa.Sa);
                            Sa.Yc = Gh ? Gh: Sa.Yc;
                            Sa.im = Hh ? Hh: Sa.im;
                            Sa.wx(xf ? xf: Sa.Ff);
                            Sa.vq = Ud ? Ud: Sa.vq;
                            Sa.rj = yf ? yf: Sa.rj;
                            Sa.sj = xd ? xd: Sa.sj;
                            bB(Sa.sd, Ih);
                            bB(Sa.je, fj);
                            bB(Sa.xe, vf);
                            bB(Sa.Ae, wf);
                            bB(Sa.Jb, Jh);
                            bB(Sa.Ke, te);
                            Sa.Tq = 12;
                            Sa.Pr = 2;
                            Sa.ot = 3;
                            aB(hc.ei.Ha, hd);
                            aB(hc.fi.Ha, id);
                            aB(hc.gi.Ha, jd);
                            aB(hc.hi.Ha, kd); (pe = hc) && w.i.D.push(pe)
                        }
                        w.i.gg = w.i.D[0];
                        w.i.ce = Hz()
                    }
                    a.eE.Kw(d.monsterTypes);
                    var jg = d.settings.upgrades,
                    Vd, Nd;
                    for (Vd in jg) Object.prototype.hasOwnProperty.call(jg, Vd) && ((Nd = wx[Vd]) ? Nd.md = jg[Vd] : console.log("failed to lookup settingsId: " + Vd));
                    var tl = a.AE,
                    kg = d.scrollInventory;
                    if (kg) {
                        var ue;
                        for (ue = 0; ue < kg.length; ue++) tl.ts(kg[ue])
                    }
                    var Uc = d.pointManagerState;
                    if (Uc) {
                        var ve = Uc.spentAdventurePoints,
                        zf = Uc.pointsByType,
                        we = Uc.pointUpgrades;
                        w.i.ae.An = ve ? ve: 0;
                        if (zf && 0 !== zf.length) {
                            var xe;
                            for (xe = 0; xe < zf.length; xe++) {
                                var Wd = zf[xe];
                                if (Wd) {
                                    var yd = Wd.pointEventType,
                                    lg = Wd.points,
                                    mg = Wd.count;
                                    yd && (w.i.ae.Qi[yd] = lg ? lg: 0, w.i.ae.pj[yd] = mg ? mg: 0)
                                }
                            }
                        }
                        if (we && 0 !== we.length) {
                            var Af;
                            for (Af = 0; Af < we.length; Af++) {
                                var ng = we[Af];
                                if (ng) {
                                    var Lh = ng.upgradeId;
                                    if (Lh) {
                                        var ul = !!ng.upgradePurchased,
                                        Bf = void 0;
                                        b: {
                                            for (var Mh = w.i.ae,
                                            Pe = void 0,
                                            Pe = 0; Pe < Mh.tl.length; Pe++) if (Mh.tl[Pe].kh.Yb === Lh) {
                                                Bf = Mh.tl[Pe];
                                                break b
                                            }
                                            Bf = null
                                        }
                                        Bf && Bf.ft(ul)
                                    }
                                }
                            }
                        }
                        Ur(w.i.ae)
                    }
                    var gj = d.achievementManager;
                    if (gj) {
                        var Qe = gj.achievements;
                        if (Qe) {
                            var Cf;
                            for (Cf = 0; Cf < Qe.length; Cf++) {
                                var Xd = Qe[Cf];
                                if (Xd) {
                                    var Oc = Xd.achievementId,
                                    Yd = Xd.obtained,
                                    Re = Xd.applied;
                                    if (Oc) {
                                        var Zd = w.i.Ig.Lt[Oc];
                                        Zd ? (Zd.We = Yd ? !0 : !1, Zd.Of = Re ? !0 : !1) : console.log("Failed to find achievement: " + Oc)
                                    }
                                }
                            }
                        }
                    }
                    var Vc = w.i.Ig;
                    0 != Vc.ik.length && (Vc.ik.length = 0);
                    0 != Vc.Ze.length && (Vc.Ze.length = 0);
                    var Od, wc;
                    for (Od = 0; Od < Vc.jj.length; Od++) wc = Vc.jj[Od],
                    wc.We ? wc.Of ? wc.We && wc.Of && Tr(wc.h, wc.Vt) : Vc.Ze.push(wc) : Vc.ik.push(wc);
                    var zd = d.potionInventory;
                    if (zd) {
                        var Ad;
                        for (Ad = 0; Ad < zd.length; Ad++) {
                            var Nh = zd[Ad],
                            hj = Nh.active,
                            vl = Nh.activeStartTurn,
                            og;
                            b: {
                                for (var ij = Nh.potionId,
                                Df = void 0,
                                Df = 0; Df < Sq.length; Df++) if (ij === Sq[Df].ic) {
                                    og = Sq[Df];
                                    break b
                                }
                                console.log("failed to find potion by id: " + ij);
                                og = null
                            }
                            if (og) {
                                var Oh = new Tq(og);
                                Vq(Oh, hj);
                                Oh.Vl = vl;
                                rr(Oh)
                            }
                        }
                    }
                    ed(w.S);
                    xs();
                    Iz();
                    w.$h.J()
                } else w.eA();
                w.Kw();
                return ! 0
            }
        }
    }
    return ! 1
}
function vz(a) {
    return (a = JSON.stringify(lB(a))) ? fa.cD(a) : null
}
function lB(a) {
    var b;
    if (w.Em) {
        var c = a.Zp,
        d = Date.now(),
        f = w.Em,
        g = w.i.$a,
        h = w.i.Gj,
        l = w.wb,
        n = w.lg,
        p = w.Fe,
        s = w.i.wh,
        u,
        y = w.S;
        u = {
            worldCenterX: y.he,
            worldCenterY: y.ie,
            blockShiftCol: y.R,
            blockShiftRow: y.L
        };
        var A, C = w.Nb;
        A = {
            infoTextVisible: C.Mm,
            spellEffectsVisible: C.nq,
            mapOverlayVisible: C.up,
            offlineProcessingEnabled: C.Jp,
            inactiveTabProcessingEnabled: C.bp,
            spriteRenderOrderEnabled: C.rq,
            fpsVisible: C.Po
        };
        var v = w.Aa.Sd,
        D = w.Aa.Mk,
        N = [],
        I = w.Aa.Ab,
        x,
        z;
        for (z = 0; z < I.length; z++) {
            var O = I[z];
            x = {
                dungeonId: O.ag,
                discovered: O.qf,
                conquered: O.cb,
                cleared: O.Lc,
                clearedTurn: O.Mg,
                dungeonFarm: O.oe,
                farmStartTurn: O.zi,
                dungeonFarmCost: O.Nk,
                dungeonType: O.Go,
                levelCount: O.rs
            };
            N.push(x)
        }
        var J = {
            farmedKills: v,
            dungeonCostLevel: D,
            dungeonStates: N
        },
        la = {
            collectedGold: w.ug.ni
        },
        Q = w.kb.Uj,
        V = [],
        na = w.kb.pd,
        K,
        H;
        for (H = 0; H < na.length; H++) {
            var S = na[H];
            K = {
                castleId: S.lo,
                conquered: S.cb,
                dungeonsConquered: S.Bj,
                castleRegionLocked: S.$b,
                attackScheduled: S.ye,
                requiredMonsterLevel: S.Jf
            };
            V.push(K)
        }
        var da = {
            nextRequiredMonsterLevel: Q,
            castleStates: V
        },
        W = [],
        ia = w.Bm.nw,
        ea,
        va;
        for (va = 0; va < ia.length; va++) {
            var yb = ia[va];
            ea = {
                dungeonId: yb.ag,
                farmCol: yb.kw,
                farmRow: yb.lw
            };
            W.push(ea)
        }
        var Fb, pa = w.Mc;
        Fb = pa ? {
            dungeonId: pa.ag,
            currentLevelIndex: pa.ri
        }: null;
        var T, X = w.le;
        T = X ? {
            castleId: X.lo
        }: null;
        var Ca;
        if (w.wb) Ca = null;
        else {
            var qa = w.Ba,
            ta = qa.Ki,
            eb = qa.Li,
            Gb = qa.sp,
            Da = qa.Pa,
            ub = [],
            mb;
            for (mb = 0; mb < Da.length; mb++) ub.push(Da[mb].Xi);
            var Ea = qa.gd,
            La = [],
            wa;
            for (wa = 0; wa < Ea.length; wa++) {
                var Fa = Ea[wa];
                La.push({
                    visible: Fa.Km,
                    doorAOpen: Fa.af.Mb,
                    doorBOpen: Fa.Be.Mb
                })
            }
            Ca = {
                levelCenterX: ta,
                levelCenterY: eb,
                levelSeed: Gb,
                roomVisibility: ub,
                hallways: La
            }
        }
        var ha;
        if (w.wb) ha = null;
        else {
            var ja = w.th.Mn,
            Ga = [],
            bb;
            for (bb = 0; bb < ja.length; bb++) {
                var za = ja[bb];
                Ga.push({
                    levelX: za.zq,
                    levelY: za.Aq,
                    opened: za.Kg,
                    settingsId: za.BC.uh,
                    westWall: za.VE,
                    roomId: za.Nn.fk
                })
            }
            ha = Ga
        }
        var nb = w.nh.at,
        fb = [],
        cb;
        for (cb = 0; cb < nb.length; cb++) {
            var Ua = nb[cb];
            fb.push({
                scrollId: Ua.qg,
                count: Ua.mh,
                locked: Ua.Qe,
                upgradeCount: Ua.tg
            })
        }
        var Va = w.Yj.re,
        mc = [],
        vb;
        for (vb = 0; vb < Va.length; vb++) {
            var Sb = Va[vb];
            mc.push({
                potionId: Sb.ic,
                active: Sb.Oe,
                activeStartTurn: Sb.Vl
            })
        }
        var Ma, zb = w.i.da;
        Ma = {
            gold: zb.fd,
            kills: zb.Je,
            experiencePoints: zb.cg
        };
        var Hb = hB(w.i.Ih),
        ac = hB(w.i.Ua),
        ob,
        pb = w.i.Bg,
        Ha = w.i.Bg,
        jb = {},
        Ab,
        Bb,
        qb;
        for (qb = 0; qb < av.length; qb++) Ab = av[qb].pa,
        Bb = cs(Ha, Ab),
        0 < Bb && (jb[Ab] = Bb);
        var wb = w.i.Bg,
        Ib = {},
        Ec, bc, Wa;
        for (Wa = 0; Wa < av.length; Wa++) Ec = av[Wa].pa,
        bc = bs(wb, Ec),
        0 < bc && (Ib[Ec] = bc);
        ob = {
            partySize1Victories: pb.hn,
            partySize2Victories: pb.jn,
            partySize3Victories: pb.kn,
            maxContinuationVictories: pb.Xm,
            currentContinuationVictories: pb.mm,
            singleClassVictories: pb.vn,
            classVictories: Ib,
            soloClassVictories: jb,
            currentContinueCount: pb.nm
        };
        var cc = [],
        Qa;
        for (Qa = 0; Qa < w.i.D.length; Qa++) cc.push(YA(w.i.D[Qa]));
        var nc, sa = w.ob,
        Tb = [],
        qc = w.ob,
        Fc = qc.fc,
        Cb;
        for (Cb = qc.hd; Cb <= Fc; Cb++) Tb.push(eB(Cb, Th(qc, Cb)));
        nc = {
            monsterLevelStates: Tb,
            minUnlockedLevel: sa.hd,
            maxUnlockedLevel: sa.fc
        };
        var kb, Ra, Ja = {};
        for (kb in E) Object.prototype.hasOwnProperty.call(E, kb) && (Ra = E[kb], Ja[Ra.c] = Ra.md);
        var Db = {
            upgrades: Ja
        },
        gb = w.i.ae.An,
        rb = w.i.ae,
        dc = [],
        Ka,
        Xa,
        hb,
        lb;
        for (lb = 0; lb < Qr.length; lb++) Ka = Qr[lb].h,
        Xa = rb.Qi[Ka],
        hb = rb.pj[Ka],
        dc.push({
            pointEventType: Ka,
            points: Xa,
            count: hb
        });
        var rc = [],
        sc = w.i.ae.tl,
        Aa;
        for (Aa = 0; Aa < sc.length; Aa++) {
            var db = sc[Aa];
            rc.push({
                upgradeId: db.kh.Yb,
                upgradePurchased: db.He()
            })
        }
        var Mc = Ca,
        ec = ha,
        Ub = {
            spentAdventurePoints: gb,
            pointsByType: dc,
            pointUpgrades: rc
        },
        sb = [],
        ka = w.i.Ig.jj,
        Eb,
        xb;
        for (xb = 0; xb < ka.length; xb++) {
            var Na = ka[xb];
            Eb = {
                achievementId: Na.k,
                obtained: Na.We,
                applied: Na.Of
            };
            sb.push(Eb)
        }
        b = {
            saveKey: c,
            gameTimestamp: d,
            gameInitialized: f,
            turnNumber: g,
            frameNumber: h,
            worldActive: l,
            partyCreated: n,
            gameWon: p,
            victoryCount: s,
            world: u,
            gameOptions: A,
            dungeonManagerState: J,
            shopManager: la,
            castleManager: da,
            farms: W,
            currentDungeon: Fb,
            currentCastle: T,
            level: Mc,
            treasureChestManager: ec,
            scrollInventory: fb,
            potionInventory: mc,
            party: Ma,
            statistics: Hb,
            totalStatistics: ac,
            victoryStatistics: ob,
            adventurers: cc,
            monsterTypes: nc,
            settings: Db,
            pointManagerState: Ub,
            achievementManager: {
                achievements: sb
            }
        }
    } else b = {
        saveKey: a.Zp,
        gameInitialized: !1,
        partyCreated: !1,
        gameWon: !1
    };
    return b
};
function th(a, b) {
    return Math.round(w.Sf + (a - w.Ba.Ki - (b - w.Ba.Li)))
}
function uh(a, b) {
    return Math.round(w.Tf + 0.5 * (a - w.Ba.Ki + (b - w.Ba.Li)))
}
function Zy(a, b) {
    var c = w.vl;
    return w.Sf + ((a / w.B | 0) - c.vk - ((b / w.B | 0) - c.wk)) * w.B + ((a % w.B | 0) - (b % w.B | 0)) - c.zt
}
function $y(a, b) {
    var c = w.vl;
    return w.Tf + ((a / w.B | 0) - c.vk + ((b / w.B | 0) - c.wk)) * w.Nh + (((a % w.B | 0) + (b % w.B | 0)) / 2 | 0) - c.At
};
function mB() {
    this.yw = this.Jo = 0;
    this.zD = 3;
    this.gD = 2;
    this.cw = 0;
    this.PC = 4;
    this.Qt = 0;
    this.TC = 2;
    this.rk = this.bu = 0
}
function Iz() {
    var a, b;
    for (a = 0; a < w.i.D.length; a++) b = w.i.D[a],
    b.Zi = ws(b)
}
function sw(a, b, c) {
    var d = new Uh(a.za, 1, a.pa, a, null),
    f = d.K;
    d.ee = w.fh.v(a.d);
    var g = hi(a.nb());
    d.Fh = g;
    g = d.p;
    g.w = b.p.w;
    g.cd = b.p.cd;
    t(g.u, c.T, c.U);
    var h = b.p.Db;
    c = h.T + m( - 10 + 20 * Math.random());
    h = h.U + m( - 10 + 20 * Math.random());
    t(g.Db, c, h);
    g = b.K.Eb;
    d.xg = b;
    b.yg || (b.yg = []);
    b.yg.push(d);
    1 === d.zb && d.Kc.oi && (b.En = d);
    d.QB = w.i.$a;
    d.RB = a.Oi;
    ii(d, g);
    f.Eb = g;
    ji(f, g, a.Ma);
    if (a.jl) for (b = 0; b < a.jl.length; b++) ki(d, new li(a.jl[b]));
    b = d.xg;
    a = d.Kc.Bp;
    Ni(d.K);
    Oi(d, b.ei);
    Oi(d, b.fi);
    Oi(d, b.gi);
    Oi(d, b.hi);
    if (a) for (b = 0; b < a.length; b++) f = a[b],
    Qi(d, f.f, f.g);
    w.Ni.Tt(d);
    w.i.aa.bs();
    Kd(18)
}
function oi(a, b, c) {
    var d = new fi(a.Ka, a.d, b),
    f = new Uh(a.za, 3, a.pa, a, null),
    g = f.K;
    f.gq(d);
    f.ee = d.ll;
    d = hi(a.nb());
    f.Fh = d;
    ii(f, b);
    g.Eb = b;
    ji(g, b, a.Ma);
    if (a.Jm) for (b = 0; b < a.Jm.length; b++) ki(f, new li(a.Jm[b]));
    b = f.p;
    b.w = c;
    b.cd = null;
    var h = ug(c) + w.B,
    g = wg(c) + w.B,
    d = xg(c) - w.B;
    c = h + k(vg(c) - w.B - h);
    g += k(d - g);
    t(b.u, c, g);
    mi(f, a.Nr);
    return f
}
function ii(a, b) {
    var c = a.Z;
    if (c && 0 < c.length) {
        var d, f;
        for (f = 0; f < c.length; f++) {
            d = c[f];
            var g = a,
            h = b,
            l = w.Sm,
            n = l.uf((100 - E.Yl.t) / 100); (d = Nv(l, d, g, h, n)) && a.Qk(d)
        }
    }
}
function Hz() {
    var a = new Uh(bv.za, 5, 0, bv, null),
    b = a.K,
    c = vs();
    ii(a, c);
    b.Eb = c;
    ji(b, c, bv.Ma);
    return a
}
function hi(a) {
    var b = new Wt,
    c, d;
    for (d = 0; d < a.length; d++) c = a[d],
    c.Wa(),
    b.fo.push(c);
    return b
}
function ji(a, b, c) {
    var d = Ia(b, rx, 1);
    a.Am = d;
    d = Ia(b, vx, c.Qf);
    a.je.Pc = d;
    d = Ia(b, vx, c.Rf);
    a.xe.Pc = d;
    d = Ia(b, vx, c.Zf);
    a.Ae.Pc = d;
    d = Ia(b, vx, c.Xf);
    a.sd.Pc = d;
    d = Ia(b, sx, c.Cf);
    a.Jb.Pc = d;
    c = Ia(b, tx, c.Ef);
    a.Ke.Pc = c;
    a.Sa = m($h(a.Jb));
    a.Yc = $h(a.Ke);
    b = Ia(b, ux, 1);
    a.mt = b
}
mB.prototype.Lp = function(a) {
    if (!a.Va) {
        var b = a.xg;
        if (b && b.yg) {
            var c = b.yg.indexOf(a); - 1 < c && b.yg.splice(c, 1);
            b.En === a && (b.En = null)
        }
        a.Va = !0;
        w.Ni.Lp(a)
    }
};
mB.prototype.ol = function(a, b) {
    if (!b.Va) {
        var c = b.p,
        d = b.K.Eb,
        f = 1 === a.zb ? a.xg: a;
        $t(f) && (f.K.im++, Is(Yq.t), w.i.aa.cp(), 5 === f.zb && w.i.aa.gp(), 1 === a.zb && (w.i.aa.$k(), f.K.$k()), f = b.Sb, uw(f.No * Zq.t), ui(f));
        var f = c.w,
        g = ug(f) + w.B,
        h = vg(f) - w.B,
        l = wg(f) + w.B,
        n = xg(f) - w.B;
        if (k(100) <= E.Lr.t) {
            var p = Dg();
            if (0 < p) {
                var s = new Eg(p, nB(c.Ob(), g, h), nB(c.Pb(), l, n), f);
                w.ff.pe.push(s);
                kr.t && (p = new Eg(p, nB(c.Ob(), g, h), nB(c.Pb(), l, n), f), w.ff.pe.push(p))
            }
        }
        k(100) <= E.$s.t && (p = w.nh.Pl, p = p[k(p.length)], p = new Mq(p, nB(c.Ob(), g, h), nB(c.Pb(), l, n), f), w.Uh.kf.push(p));
        100 * Math.random() <= E.Ns.t && (p = new Tq(Sq[k(Sq.length)]), p = new mr(p, nB(c.Ob(), g, h), nB(c.Pb(), l, n), f), w.Ti.Hf.push(p));
        if (k(100) <= E.ls.t || dr.t) Xv(w.dh, nB(c.Ob(), g, h), nB(c.Pb(), l, n), f, d),
        lr.t && Xv(w.dh, nB(c.Ob(), g, h), nB(c.Pb(), l, n), f, d);
        b.Va = !0;
        c = ww();
        b.ee = c;
        w.Gf.ol(b);
        w.i.Xg.ol();
        Kd(1);
        0.15 > Math.random() && (c = oB(), sh(w.pc, b, c, "white"))
    }
};
function ww() {
    switch (k(3)) {
    case 0:
        return w.I.v("L2_SkeletonHumanLarge.PNG");
    case 1:
        return w.I.v("L2_SkeletonHumanMedium.PNG");
    case 2:
        return w.I.v("L2_SkeletonDog.PNG");
    case 3:
        return w.I.v("L2_SkeletonHumanSmall.PNG");
    default:
        return w.I.v("L2_SkeletonHumanMedium2.PNG")
    }
}
function oB() {
    switch (k(16)) {
    case 0:
        return "死亡!";
    case 1:
        return "不!";
    case 2:
        return "啊啊啊!";
    case 3:
        return "哦哦哦";
    case 4:
        return "呃呃呃";
    case 5:
        return "哎呀!";
    case 6:
        return "##$@#!";
    case 7:
        return "哎哟!";
    case 8:
        return "我的腿!";
    case 9:
        return "呃!";
    case 10:
        return "嘿!";
    case 11:
        return "粗鲁!";
    case 12:
        return "不公平!";
    case 13:
        return "神啊!";
    case 14:
        return "亲爱的.";
    default:
        return "我已经死了."
    }
}
function vw(a, b, c) {
    var d = 3 * w.B,
    f = Math.max(b, a - d),
    d = Math.min(a + d, c);
    if (f >= d) return a < b ? b: a > c ? c: a;
    a = f + k(d - f);
    return a < b ? b: a > c ? c: a
}
function nB(a, b, c) {
    var d = w.Nh,
    f = Math.max(b, a - d),
    d = Math.min(a + d, c);
    if (f >= d) return a < b ? b: a > c ? c: a;
    a = f + k(d - f);
    return a < b ? b: a > c ? c: a
}
function pB(a) {
    var b = w.Qo;
    b.Jo += a;
    if (15 <= b.Jo) {
        w.i.$a++;
        b.Jo -= 15;
        b.yw++;
        if (b.yw >= b.zD) {
            b.yw = 0;
            var c, d = Qd();
            for (c = 0; c < d.length; c++) {
                var f = d[c].K,
                g = $h(f.Jb);
                if (f.Sa < g) {
                    var h = Math.max(1, m(g * (f.Pr + f.ap + Ys.t) / 100));
                    f.Sa = Math.min(g, f.Sa + h)
                }
                var l = $h(f.Ke);
                if (f.Yc < l) {
                    var n = Math.max(1, m(l * (f.ot + f.pq + Zs.t) / 100));
                    f.Yc = Math.min(l, f.Yc + n)
                }
            }
        }
        var p = w.Ni.eh,
        s, u, y, A, C;
        for (C = p.length - 1; 0 <= C; C--) s = p[C],
        u = s.xg,
        u.Va ? (qB(s), w.Qo.Lp(s)) : (y = s.QB, A = s.RB, 0 > A || (y > w.i.$a ? console.log("minion bug: start turn in future.") : w.i.$a - y > A && (qB(s), w.Qo.Lp(s))));
        var v = xh(),
        D = Qd(),
        N;
        for (N = 0; N < D.length; N++) Ow(D[N].Ja, !0);
        for (N = 0; N < v.length; N++) Ow(v[N].Ja, !1);
        w.i.aa.is();
        var I = w.i.da;
        w.wb ? I.ou() : (I.Ks = !1, I.gn = null, I.Mp = !1, I.nu());
        w.wb || (w.ff.zl(), w.Uh.zl(), w.Ti.zl(), w.dh.zl());
        rB(Qd());
        rB(xh());
        var x = w.Yj,
        z = 0 === w.i.$a % 3,
        O, J, la, Q, V = 800 + Ts.t;
        for (O = x.re.length - 1; 0 <= O; O--) J = x.re[O],
        J.Oe && (Q = J.Vl, z && er.t && Q < w.i.$a && (Q++, J.Vl = Q), w.i.$a - Q >= V && (Vq(J, !1), la = x.re.indexOf(J), -1 < la && x.re.splice(la, 1)));
        if (jr.t && 0 < xh().length && (b.bu++, b.bu >= b.TC)) {
            b.bu = 0;
            var na = w.nh.Pl;
            b.rk >= na.length && (b.rk = 0);
            nz(b.rk);
            Hq(na[b.rk], !0);
            b.rk++;
            b.rk >= na.length && (b.rk = 0)
        }
        b.cw++;
        if (b.cw >= b.gD) {
            b.cw = 0;
            var K = w.Aa,
            H, S, da = !1,
            W, ia = w.i.$a;
            for (H = 0; H < K.ze.length; H++) S = K.ze[H],
            1500 <= ia - S.Mg && (da = !0, S.Lc = !1, S.Mg = 0);
            if (da) {
                for (H = K.ze.length - 1; 0 <= H; H--) S = K.ze[H],
                S.Lc || (K.ze.splice(H, 1), S.qf && !S.Lc && (W = K.Ge.indexOf(S), 0 > W && K.Ge.push(S)));
                fe(K, K.Ge)
            }
            var ea, va, yb = ar.t,
            Fb = br.t,
            pa = (100 + Us.t) * gr.t;
            for (H = 0; H < K.dg.length; H++) S = K.dg[H],
            ea = S.Mg,
            va = S.zi,
            ea > ia && (ea = 0, S.Mg = ea),
            va > ia && (va = 0, S.zi = va),
            S.Lc ? (Fb && (ea -= 2, S.Mg = ea), 1500 <= ia - ea && (S.Lc = !1, S.zi = ia)) : (yb && (va -= 2, S.zi = va), 1200 <= ia - va && (K.Sd += pa, S.Lc = !0, S.Mg = ia))
        }
        b.Qt++;
        if (b.Qt >= b.PC) {
            b.Qt = 0;
            var T = w.i.Ig,
            X, Ca;
            for (X = T.ik.length - 1; 0 <= X; X--) {
                var qa = Ca = T.ik[X];
                qa.We || (qa.We = qa.ab ? as(qa) : ds(qa) >= qa.j);
                qa.We && (T.ik.splice(X, 1), T.Ze.push(Ca))
            }
            for (X = T.Ze.length - 1; 0 <= X; X--) Ca = T.Ze[X],
            Ca.Of && T.Ze.splice(X, 1)
        }
    }
    w.i.Gj++;
    var ta = xh(),
    eb,
    Gb;
    for (Gb = 0; Gb < ta.length; Gb++) if (eb = ta[Gb].p, null != eb.Gd) {
        var Da = eb;
        if (Da.Gd) {
            var ub = Da.Jw * a * 3;
            ab(Da.ra, Da.Gd);
            Mb(Da.ra);
            Nb(Da.ra, ub);
            var mb = Lb(Da.Gd);
            ub >= mb ? Da.Gd = null: Nb(Da.Gd, (mb - ub) / mb);
            ib(Da.u, Da.ra);
            Da.w && Fg(Da.w, Da.u, w.Nh)
        }
    }
    var Ea = xh(),
    La = Qd(),
    wa;
    for (wa = 0; wa < La.length; wa++) Lq(La[wa], a);
    for (wa = 0; wa < Ea.length; wa++) Lq(Ea[wa], a);
    var Fa = w.Xe,
    ha, ja, Ga, bb = !1,
    za, nb = !1;
    for (ha = 0; ha < Fa.kj.length; ha++) if (ja = Fa.kj[ha], Ga = ja.Ca, (za = ja.xb) && za.Io === Yb) {
        var fb;
        a: {
            var cb = ja,
            Ua = cb.Xb;
            Ua && !Ua.Cj && pc(w.df, cb.Xb);
            if (!Ua || Ua.Pk || Ua.bg) {
                var Va = cb.xb;
                if (!Va.Cj) {
                    var mc = cb.Ib;
                    if (mc && 8 == mc.ga) {
                        var vb = cb,
                        Sb = w.RC,
                        Ma = vb.Da,
                        zb = vb.Ca,
                        Hb = m((zb.K.ho + 1) * w.B),
                        ac = gw(zb, Ma, 200, Hb);
                        if (ac && 0 !== ac.length) {
                            var ob = void 0,
                            pb = void 0,
                            Ha = zb.p.u,
                            jb = Ma.p.u,
                            Ab = void 0,
                            Bb = void 0,
                            qb = void 0,
                            wb = void 0,
                            Ib = vb.Ib;
                            if (Ib) wb = Ib.ca;
                            else var Ec = zb.So(),
                            bc = Ec ? Ec.Rm: null,
                            wb = bc ? bc.ms: null;
                            wb || (wb = "Red Splat");
                            for (var Wa = void 0,
                            ob = 0; ob < ac.length; ob++) {
                                qb = ac[ob];
                                Ab = qb.p;
                                Bb = Ab.u;
                                if (qb === Ma) Sw(Ab, Ha, jb, Hb);
                                else {
                                    Wa = new fw;
                                    Wa.Ca = zb;
                                    Wa.Cb(qb);
                                    Wa.yd = !1;
                                    Wa.Ib = Ib;
                                    Sw(Ab, Ha, jb, Hb);
                                    var cc = new Zb(wb, jb, Bb, !1, 1);
                                    Wa.xb = cc;
                                    pb = Math.max(1, zw(zb, Ma));
                                    Wa.Rd = !1;
                                    Wa.Jc = pb;
                                    mw(w.Xe, Wa)
                                }
                                var Qa = Sb,
                                nc = qb,
                                sa = nc.p.u,
                                Tb = new fw;
                                Tb.Ca = vb.Ca;
                                Tb.Cb(nc);
                                Tb.yd = !1;
                                Tb.Ib = Qa.Wq;
                                Qa.Wq || (Qa.Wq = new li(jq));
                                var qc = Qa.Wq.ca;
                                if (qc) {
                                    var Fc = new Zb(qc, sa, sa, !1, 1);
                                    Tb.xb = Fc
                                }
                                mw(w.Xe, Tb)
                            }
                        }
                    }
                    pc(w.df, Va)
                } else if (Va.bl()) {
                    fb = cb.Vn = !0;
                    break a
                }
            }
            fb = !1
        }
        fb ? bb = !0 : za.Cj && (nb = !0)
    } else if (Ga.Va) bb = ja.Vn = !0;
    else if (ja.yd) {
        var Cb = Fa,
        kb = ja,
        Ra = kb.Xb;
        Ra && !Ra.Cj && pc(w.df, Ra);
        if (Ra) {
            var Ja = kb.Ib;
            if (Ja && 12 === Ja.ga) {
                var Db = Ra.wm;
                t(kb.Ca.p.u, Db.T, Db.U)
            }
        } (!Ra || Ra.Pk || Ra.bg) && jw(Cb, kb) && (bb = !0)
    } else jw(Fa, ja) && (bb = !0);
    if (nb) {
        var gb = qi(Ga),
        rb,
        dc,
        Ka,
        Xa,
        hb,
        lb,
        rc,
        sc,
        Aa,
        db,
        Mc = 1 === Ga.zb ? Ga.xg.K: Ga.K;
        for (db = 0; db < gb.length; db++) if (rb = gb[db], !rb.Va && (dc = rb.p.u, Ka = w.Ba.Ai(dc.T), Xa = w.Ba.Bi(dc.U), (hb = w.Ba.hb(Ka, Xa)) && (lb = hb.Pq) && lb.Cj)) if (lb.bl()) sg(hb, null);
        else if (lb.bx !== lb.oc && (sc = hb.li, 0 !== sc && (Aa = k(sc + 1), 0 !== Aa))) {
            hb.qB(Math.max(0, sc - Aa));
            var ec = rc = rb.K;
            ec.Sa -= m(Aa);
            0 > ec.Sa && (ec.Sa = 0);
            Mc.rj += Aa;
            rc.sj += Aa;
            rh(rb, Aa);
            0 === rc.Sa && tw(lb.ud, rb)
        }
    }
    if (bb) for (ha = Fa.kj.length - 1; 0 <= ha; ha--) Fa.kj[ha].Vn && Fa.kj.splice(ha, 1);
    var Ub = w.df,
    sb;
    for (sb = 0; sb < Ub.Wg.length; sb++) {
        var ka = Ub.Wg[sb],
        Eb = a;
        ka.Cj = !0;
        if (1 === ka.Io) {
            if (ka.Xb && !ka.Pk) {
                ab(ic, ka.xi);
                tb(ic, ka.wm);
                var xb = Lb(ic),
                Na = void 0,
                Na = ka.ud === w.i.ce ? 11 * Eb: ka.Gs ? 5 * Eb: 7 * Eb;
                xb <= Na ? (ab(ka.wm, ka.xi), ka.Pk = !0, ka.bg = !0) : (Mb(ic), Nb(ic, Na), ib(ka.wm, ic))
            }
            ka.nd.zc ? ka.oc = $b(ka) : jc(ka, Eb)
        } else ka.Io === Yb ? jc(ka, Eb) : 2 === ka.Io && (ka.yi += Eb * ya, 400 <= ka.yi && (ka.bg = !0, ka.Pk = !0))
    }
    for (sb = Ub.Wg.length - 1; 0 <= sb; sb--) Ub.Wg[sb].bl() && Ub.Wg.splice(sb, 1);
    var Ya = w.Di,
    tc, me, ne, Le = !1;
    for (tc = 0; tc < w.i.D.length; tc++) me = w.i.D[tc].Ld,
    me.ip && (Le = !0, me.ip = !1);
    if (Le) {
        Ya.Fj.length = 0;
        var Td, oe, Y, nf;
        for (tc = 0; tc < w.i.D.length; tc++) for (oe = w.i.D[tc], ne = oe.Ld.items, Td = 0; Td < ne.length; Td++) Y = ne[Td],
        (nf = oe.ef(Y.r)) && !ss(Y, nf) || Ya.Fj.push(Y);
        1 < Ya.Fj.length && cw(Ya, Ya.Fj)
    }
    w.pc.oy();
    if (!w.ig) {
        var Nc;
        for (Nc = 0; Nc < Nx.length; Nc++) ls(Nx[Nc]);
        var gd;
        for (Nc = 0; Nc < w.i.D.length; Nc++) gd = w.i.D[Nc],
        ls(gd.ei),
        ls(gd.fi),
        ls(gd.gi),
        ls(gd.hi)
    }
    var uc, U = w.i.D,
    Z = 0,
    $ = 0;
    if (w.wb) {
        for (uc = 0; uc < U.length; uc++) Z += U[uc].p.dc(),
        $ += U[uc].p.ec();
        var ba = Z / U.length,
        ca = $ / U.length,
        q = w.S;
        if (null == ba || null == ca) console.log("Setting world center x/y to null. worldCenterX=" + ba + " y=" + ca);
        else if (q.he = ba, q.ie = ca, !$f(q.q[1][1], q.he, q.ie)) {
            var pe;
            var fc = !1,
            vd, qe, gc, vc;
            for (vd = 0; 3 > vd; vd++) for (qe = 0; 3 > qe; qe++) if ($f(q.q[vd][qe], q.he, q.ie)) {
                fc = !0;
                gc = vd;
                vc = qe;
                break
            }
            if (fc) {
                var $c = q.q[0][0],
                Gc = q.q[0][1],
                ad = q.q[0][2],
                Vb = q.q[1][0],
                Tc = q.q[1][1],
                hd = q.q[1][2],
                id = q.q[2][0],
                jd = q.q[2][1],
                kd = q.q[2][2];
                0 === gc ? (q.R--, 0 === vc ? (q.L--, q.q[0][0] = kd, q.q[0][1] = id, q.q[0][2] = jd, q.q[1][0] = ad, q.q[1][1] = $c, q.q[1][2] = Gc, q.q[2][0] = hd, q.q[2][1] = Vb, q.q[2][2] = Tc, B(q.q[0][0], q.R, q.L, !0), B(q.q[0][1], q.R, q.L + 1, !0), B(q.q[0][2], q.R, q.L + 2, !0), B(q.q[1][0], q.R + 1, q.L, !0), B(q.q[1][1], q.R + 1, q.L + 1, !1), B(q.q[1][2], q.R + 1, q.L + 2, !1), B(q.q[2][0], q.R + 2, q.L, !0), B(q.q[2][1], q.R + 2, q.L + 1, !1), B(q.q[2][2], q.R + 2, q.L + 2, !1)) : 1 === vc ? (q.q[0][0] = id, q.q[0][1] = jd, q.q[0][2] = kd, q.q[1][0] = $c, q.q[1][1] = Gc, q.q[1][2] = ad, q.q[2][0] = Vb, q.q[2][1] = Tc, q.q[2][2] = hd, B(q.q[0][0], q.R, q.L, !0), B(q.q[0][1], q.R, q.L + 1, !0), B(q.q[0][2], q.R, q.L + 2, !0), B(q.q[1][0], q.R + 1, q.L, !1), B(q.q[1][1], q.R + 1, q.L + 1, !1), B(q.q[1][2], q.R + 1, q.L + 2, !1), B(q.q[2][0], q.R + 2, q.L, !1), B(q.q[2][1], q.R + 2, q.L + 1, !1), B(q.q[2][2], q.R + 2, q.L + 2, !1)) : (q.L++, q.q[0][0] = jd, q.q[0][1] = kd, q.q[0][2] = id, q.q[1][0] = Gc, q.q[1][1] = ad, q.q[1][2] = $c, q.q[2][0] = Tc, q.q[2][1] = hd, q.q[2][2] = Vb, B(q.q[0][0], q.R, q.L, !0), B(q.q[0][1], q.R, q.L + 1, !0), B(q.q[0][2], q.R, q.L + 2, !0), B(q.q[1][0], q.R + 1, q.L, !1), B(q.q[1][1], q.R + 1, q.L + 1, !1), B(q.q[1][2], q.R + 1, q.L + 2, !0), B(q.q[2][0], q.R + 2, q.L, !1), B(q.q[2][1], q.R + 2, q.L + 1, !1), B(q.q[2][2], q.R + 2, q.L + 2, !0))) : 1 === gc ? 0 === vc ? (q.L--, q.q[0][0] = ad, q.q[0][1] = $c, q.q[0][2] = Gc, q.q[1][0] = hd, q.q[1][1] = Vb, q.q[1][2] = Tc, q.q[2][0] = kd, q.q[2][1] = id, q.q[2][2] = jd, B(q.q[0][0], q.R, q.L, !0), B(q.q[0][1], q.R, q.L + 1, !1), B(q.q[0][2], q.R, q.L + 2, !1), B(q.q[1][0], q.R + 1, q.L, !0), B(q.q[1][1], q.R + 1, q.L + 1, !1), B(q.q[1][2], q.R + 1, q.L + 2, !1), B(q.q[2][0], q.R + 2, q.L, !0), B(q.q[2][1], q.R + 2, q.L + 1, !1), B(q.q[2][2], q.R + 2, q.L + 2, !1)) : 1 === vc ? console.log("error? new center block already in the center of the grid.") : (q.L++, q.q[0][0] = Gc, q.q[0][1] = ad, q.q[0][2] = $c, q.q[1][0] = Tc, q.q[1][1] = hd, q.q[1][2] = Vb, q.q[2][0] = jd, q.q[2][1] = kd, q.q[2][2] = id, B(q.q[0][0], q.R, q.L, !1), B(q.q[0][1], q.R, q.L + 1, !1), B(q.q[0][2], q.R, q.L + 2, !0), B(q.q[1][0], q.R + 1, q.L, !1), B(q.q[1][1], q.R + 1, q.L + 1, !1), B(q.q[1][2], q.R + 1, q.L + 2, !0), B(q.q[2][0], q.R + 2, q.L, !1), B(q.q[2][1], q.R + 2, q.L + 1, !1), B(q.q[2][2], q.R + 2, q.L + 2, !0)) : (q.R++, 0 === vc ? (q.L--, q.q[0][0] = hd, q.q[0][1] = Vb, q.q[0][2] = Tc, q.q[1][0] = kd, q.q[1][1] = id, q.q[1][2] = jd, q.q[2][0] = ad, q.q[2][1] = $c, q.q[2][2] = Gc, B(q.q[0][0], q.R, q.L, !0), B(q.q[0][1], q.R, q.L + 1, !1), B(q.q[0][2], q.R, q.L + 2, !1), B(q.q[1][0], q.R + 1, q.L, !0), B(q.q[1][1], q.R + 1, q.L + 1, !1), B(q.q[1][2], q.R + 1, q.L + 2, !1)) : 1 === vc ? (q.q[0][0] = Vb, q.q[0][1] = Tc, q.q[0][2] = hd, q.q[1][0] = id, q.q[1][1] = jd, q.q[1][2] = kd, q.q[2][0] = $c, q.q[2][1] = Gc, q.q[2][2] = ad, B(q.q[0][0], q.R, q.L, !1), B(q.q[0][1], q.R, q.L + 1, !1), B(q.q[0][2], q.R, q.L + 2, !1), B(q.q[1][0], q.R + 1, q.L, !1), B(q.q[1][1], q.R + 1, q.L + 1, !1), B(q.q[1][2], q.R + 1, q.L + 2, !1)) : (q.L++, q.q[0][0] = Tc, q.q[0][1] = hd, q.q[0][2] = Vb, q.q[1][0] = jd, q.q[1][1] = kd, q.q[1][2] = id, q.q[2][0] = Gc, q.q[2][1] = ad, q.q[2][2] = $c, B(q.q[0][0], q.R, q.L, !1), B(q.q[0][1], q.R, q.L + 1, !1), B(q.q[0][2], q.R, q.L + 2, !0), B(q.q[1][0], q.R + 1, q.L, !1), B(q.q[1][1], q.R + 1, q.L + 1, !1), B(q.q[1][2], q.R + 1, q.L + 2, !0)), B(q.q[2][0], q.R + 2, q.L, !0), B(q.q[2][1], q.R + 2, q.L + 1, !0), B(q.q[2][2], q.R + 2, q.L + 2, !0));
                pe = !0
            } else console.log("Failed to find new center block!"),
            pe = !1;
            if (!pe) {
                console.log("Bug: party not contained by block grid. fixing.");
                var eg = q.vw(q.he),
                hc = q.ww(q.ie);
                console.log("old: blockShiftCol=" + q.R + " blockShiftRow=" + q.L);
                q.R = eg - 1;
                q.L = hc - 1;
                console.log("new: blockShiftCol=" + q.R + " blockShiftRow=" + q.L);
                B(q.q[0][0], q.R, q.L, !0);
                B(q.q[0][1], q.R, q.L + 1, !0);
                B(q.q[0][2], q.R, q.L + 2, !0);
                B(q.q[1][0], q.R + 1, q.L, !0);
                B(q.q[1][1], q.R + 1, q.L + 1, !0);
                B(q.q[1][2], q.R + 1, q.L + 2, !0);
                B(q.q[2][0], q.R + 2, q.L, !0);
                B(q.q[2][1], q.R + 2, q.L + 1, !0);
                B(q.q[2][2], q.R + 2, q.L + 2, !0);
                var re = q.q[1][1];
                $f(re, q.he, q.ie) || (console.log("Failed to fix world block grid issue."), console.log("posX: " + q.he + " posY: " + q.ie), console.log("minX: " + re.yp + " maxX: " + re.Mw), console.log("minY: " + re.zp + " maxY: " + re.Nw))
            }
        }
    } else {
        for (uc = 0; uc < U.length; uc++) Z += U[uc].p.Ob(),
        $ += U[uc].p.Pb();
        var of = $ / U.length,
        wd = w.Ba;
        wd.Ki = Z / U.length;
        wd.Li = of
    }
}
function nz(a) {
    a = 30 + 126 * a;
    var b = w.Yq - 80;
    t(w.i.ce.p.u, w.Ba.Ki + (0.5 * (a - w.Sf) + (b - w.Tf)) | 0, w.Ba.Li + (b - w.Tf - 0.5 * (a - w.Sf)) | 0)
}
function rB(a) {
    var b, c;
    for (b = 0; b < a.length; b++) c = a[b],
    c.Va || (c.Ja.Kd ? c.Y = Sd: c.dr())
}
function qB(a) {
    a = w.wb ? a.p.Db: a.p.u;
    pc(w.df, new Zb("Red Splat", a, a, !1, 1))
}
function Fs(a, b) {
    if (! (w.i.da.fd < b)) {
        Ta("Dungeon", "Farm Purchased");
        Ks(b);
        a.oe = !0;
        a.zi = w.i.$a;
        he(a);
        var c = w.Bm,
        d = c.Yw(a.bc()),
        f = c.Yw(a.cc());
        le(c, new ie(a.ag, d, f));
        w.i.aa.Xr()
    }
};
function sB() {
    this.GB = !1;
    this.Os = Ba();
    this.XA = Ba();
    this.fD = 1E3 / 60;
    this.kz = 250;
    window.vE = function() {
        return window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame ||
        function(a) {
            window.setTimeout(a, 1E3 / 60)
        }
    } ();
    var a = this;
    this.sD = function() {
        a.Hr()
    };
    this.Gr = this.Fr = 0
}
sB.prototype.Hr = function() {
    if (this.GB) if (w.Em) {
        var a = Ba(),
        b = a - this.XA,
        a = Math.max(0, a - this.Os),
        c;
        this.XA = Ba();
        if (w.lg && !w.Fe && !w.Mh) if (1E3 < a && w.Nb.bp && (w.ig || (w.ig = !0, w.Vj = 0, w.jf = 0, w.Ee.Zd()), w.jf += a), w.ig) {
            for (c = 0; 200 > c && w.Vj < w.jf && !w.Fe && w.ig;) pB(15),
            w.Vj += this.kz,
            w.i.aa.fp(this.kz),
            c++;
            w.Vj >= w.jf && w.xu()
        } else {
            c = a / this.fD;
            0 < c && pB(c);
            c = w.vl;
            var d, f, g, h;
            w.wb ? (d = w.S.he, f = w.S.ie) : (d = w.Ba.Ki, f = w.Ba.Li);
            g = Math.round(d % w.B);
            h = Math.round(f % w.B);
            c.zt = g - h;
            c.At = Math.round((g + h) / 2);
            c.vk = d / w.B | 0;
            c.wk = f / w.B | 0
        }
        if (w.Mz) try {
            w.Ee.Xa()
        } catch(l) {
            console.log("Caught error. name: " + l.name + " message: " + l.message + " exception: " + l)
        }
        this.Fr++;
        this.Gr += b;
        60 <= this.Fr && (w.i.dz = this.Fr / (this.Gr / 1E3) | 0, this.Gr = this.Fr = 0);
        w.ig || (b = w.pg, Ba() - b.qs > b.UC && px(b));
        w.Mh || w.ig || w.i.aa.fp(a);
        this.Os = Ba()
    } else {
        w.eA();
        b = w.pg;
        kB(b, persistence.read());
        Ta("SaveManager", "Load");
        this.Os = Ba();
        b = w.Ee;
        a = new dy("创建队伍", !0);
        c = new dy("游戏结束", !1);
        d = new dy("游戏", !1);
        f = new dy("Char0", !1);
        g = new dy("Char1", !1);
        h = new dy("Char2", !1);
        var n = new dy("Char3", !1),
        p = new dy("Char4", !1),
        s = new dy("怪物", !1),
        u = new dy("地牢", !1),
        y = new dy("城堡", !1),
        A = new dy("点数", !0),
        C = new dy("离线", !1),
        v = new dy("信息", !0);
        b.Gh.length = 0;
        b.Gh.push(f);
        b.Gh.push(g);
        b.Gh.push(h);
        b.Gh.push(n);
        b.Gh.push(p);
        w.lg ? w.Fe ? c.ha = !0 : d.ha = !0 : a.ha = !0;
        b.Bd = new gy("gameTabMenu");
        var D = new Az(a),
        N = new sz(d),
        I = new Zz(f, "characterTabContent0", 0),
        x = new Zz(g, "characterTabContent1", 1),
        z = new Zz(h, "characterTabContent2", 2),
        O = new Zz(n, "characterTabContent3", 3),
        J = new Zz(p, "characterTabContent4", 4),
        la = new eA(s),
        Q = new uA(u),
        V = new nA(y),
        na = new BA(c),
        K = new VA(A),
        H = new PA(C),
        S = new wz(v),
        da = new by;
        hy(b.Bd, a);
        hy(b.Bd, c);
        hy(b.Bd, d);
        hy(b.Bd, f);
        hy(b.Bd, g);
        hy(b.Bd, h);
        hy(b.Bd, n);
        hy(b.Bd, p);
        hy(b.Bd, s);
        hy(b.Bd, u);
        hy(b.Bd, y);
        hy(b.Bd, A);
        hy(b.Bd, C);
        hy(b.Bd, v);
        b.Lg && (b.Lg.length = 0);
        R(b, b.Bd);
        R(b, D);
        R(b, I);
        R(b, x);
        R(b, z);
        R(b, O);
        R(b, J);
        R(b, la);
        R(b, Q);
        R(b, V);
        R(b, N);
        R(b, na);
        R(b, K);
        R(b, H);
        R(b, S);
        R(b, da);
        b.Tc.push(D);
        b.Tc.push(I);
        b.Tc.push(x);
        b.Tc.push(z);
        b.Tc.push(O);
        b.Tc.push(J);
        b.Tc.push(la);
        b.Tc.push(Q);
        b.Tc.push(V);
        b.Tc.push(N);
        b.Tc.push(na);
        b.Tc.push(K);
        b.Tc.push(H);
        b.Tc.push(S);
        w.lg || iy(b.Bd);
        w.lg && w.Ee.J();
        w.ig && w.Ee.Zd();
        w.Fe && w.Ee.Me()
    } else this.GB = w.fh.cl() && w.I.cl() && w.Kj.cl() && w.Dj.cl(),
    this.Os = Ba();
    window.vE(this.sD)
};
var w = {
    B: 27,
    Nh: 13,
    iu: 740,
    Yq: 450,
    Sf: 370,
    Tf: 225,
    fh: new Pb("spritesheet/monsters.png", 54, aa),
    I: new Pb("spritesheet/terrain.png", 54, terrainAtlas),
    Kj: new Pb("spritesheet/items.png", 32, itemsAtlas),
    Dj: new Xb([new Wb("spritesheet/SpellFXAnim1.png", 31, [{
        animationName: "Gold Sparkles",
        O: 0,
        P: 0,
        M: 7,
        N: 0
    },
    {
        animationName: "Green Sparkles",
        O: 0,
        P: 1,
        M: 7,
        N: 1
    },
    {
        animationName: "Blue Sparkles",
        O: 0,
        P: 2,
        M: 7,
        N: 2
    },
    {
        animationName: "Orange Sparkles",
        O: 0,
        P: 3,
        M: 7,
        N: 3
    },
    {
        animationName: "Pink Sparkles",
        O: 0,
        P: 4,
        M: 7,
        N: 4
    },
    {
        animationName: "Red Sparkles",
        O: 0,
        P: 5,
        M: 7,
        N: 5
    },
    {
        animationName: "Green Skull",
        O: 0,
        P: 6,
        M: 7,
        N: 6
    },
    {
        animationName: "Yellow Key",
        O: 0,
        P: 7,
        M: 7,
        N: 7
    },
    {
        animationName: "Skull Cross",
        O: 0,
        P: 8,
        M: 7,
        N: 8
    },
    {
        animationName: "Shields",
        O: 0,
        P: 9,
        M: 7,
        N: 9
    },
    {
        animationName: "Red Crosses",
        O: 0,
        P: 10,
        M: 7,
        N: 10
    },
    {
        animationName: "Fire Ring",
        O: 0,
        P: 11,
        M: 7,
        N: 11
    },
    {
        animationName: "Ice Ring",
        O: 0,
        P: 12,
        M: 7,
        N: 12
    },
    {
        animationName: "Green Ring",
        O: 0,
        P: 13,
        M: 7,
        N: 13
    },
    {
        animationName: "Pink Ring",
        O: 0,
        P: 14,
        M: 7,
        N: 14
    },
    {
        animationName: "Yellow Star",
        O: 0,
        P: 15,
        M: 7,
        N: 15
    },
    {
        animationName: "Blue Star",
        O: 0,
        P: 16,
        M: 7,
        N: 16
    },
    {
        animationName: "Green Star",
        O: 0,
        P: 17,
        M: 7,
        N: 17
    },
    {
        animationName: "White Crosses",
        O: 0,
        P: 18,
        M: 7,
        N: 18
    },
    {
        animationName: "Spider Web",
        O: 0,
        P: 19,
        M: 7,
        N: 19
    },
    {
        animationName: "Torch",
        O: 0,
        P: 20,
        M: 7,
        N: 20
    }], 7), new Wb("spritesheet/SpellFXAnim2.png", 31, [{
        animationName: "Frost",
        O: 0,
        P: 0,
        M: 7,
        N: 1
    },
    {
        animationName: "Yellow Star Circle",
        O: 0,
        P: 2,
        M: 6,
        N: 3
    },
    {
        animationName: "Circles",
        O: 0,
        P: 4,
        M: 4,
        N: 5
    },
    {
        animationName: "Gold Shield Spiral",
        O: 0,
        P: 6,
        M: 7,
        N: 7
    },
    {
        animationName: "Green Shield Spiral",
        O: 0,
        P: 8,
        M: 7,
        N: 9
    },
    {
        animationName: "Blue Shield Spiral",
        O: 0,
        P: 10,
        M: 7,
        N: 11
    },
    {
        animationName: "Pink Shield Spiral",
        O: 0,
        P: 12,
        M: 7,
        N: 13
    },
    {
        animationName: "Blue Firework",
        O: 0,
        P: 14,
        M: 7,
        N: 15
    },
    {
        animationName: "Red Firework",
        O: 0,
        P: 16,
        M: 7,
        N: 17
    },
    {
        animationName: "Bubbles",
        O: 0,
        P: 18,
        M: 2,
        N: 20
    }], 7), new Wb("spritesheet/SpellFXAnim3.png", 31, [{
        animationName: "Shield",
        O: 0,
        P: 0,
        M: 7,
        N: 1
    },
    {
        animationName: "Color Spiral",
        O: 0,
        P: 2,
        M: 7,
        N: 3
    },
    {
        animationName: "Arm Flex",
        O: 0,
        P: 4,
        M: 4,
        N: 5
    },
    {
        animationName: "Super Speed",
        O: 0,
        P: 6,
        M: 7,
        N: 7
    },
    {
        animationName: "Target",
        O: 0,
        P: 8,
        M: 7,
        N: 9
    },
    {
        animationName: "Yellow Shield Spiral",
        O: 0,
        P: 10,
        M: 6,
        N: 11
    },
    {
        animationName: "Pink Star Circle",
        O: 0,
        P: 12,
        M: 6,
        N: 13
    },
    {
        animationName: "Blue Star Circle",
        O: 0,
        P: 14,
        M: 6,
        N: 15
    },
    {
        animationName: "Green Star Circle",
        O: 0,
        P: 16,
        M: 6,
        N: 17
    },
    {
        animationName: "Gold Star Circle",
        O: 0,
        P: 18,
        M: 6,
        N: 19
    },
    {
        animationName: "Bread",
        O: 0,
        P: 20,
        M: 7,
        N: 20
    }], 7), new Wb("spritesheet/SpellFXAnim4.png", 31, [{
        animationName: "Yellow Fire Ring",
        O: 0,
        P: 0,
        M: 7,
        N: 0
    },
    {
        animationName: "Totems",
        O: 0,
        P: 1,
        M: 7,
        N: 1
    },
    {
        animationName: "Eye Blink",
        O: 0,
        P: 2,
        M: 7,
        N: 2
    },
    {
        animationName: "Pink Star",
        O: 0,
        P: 3,
        M: 7,
        N: 3
    },
    {
        animationName: "Orange Star",
        O: 0,
        P: 4,
        M: 7,
        N: 4
    },
    {
        animationName: "Red Eye Blink",
        O: 0,
        P: 5,
        M: 6,
        N: 6
    },
    {
        animationName: "Eagle",
        O: 0,
        P: 7,
        M: 7,
        N: 7
    },
    {
        animationName: "Sleep",
        O: 0,
        P: 8,
        M: 6,
        N: 9
    },
    {
        animationName: "Armor",
        O: 0,
        P: 10,
        M: 7,
        N: 10
    },
    {
        animationName: "Blind Eye Blink",
        O: 0,
        P: 11,
        M: 7,
        N: 11
    },
    {
        animationName: "Fire Rain",
        O: 0,
        P: 12,
        M: 7,
        N: 14
    },
    {
        animationName: "Blue Rain",
        O: 0,
        P: 15,
        M: 7,
        N: 17
    },
    {
        animationName: "Green Rain",
        O: 0,
        P: 18,
        M: 7,
        N: 20
    }], 7), new Wb("spritesheet/SpellFXAnim5.png", 31, [{
        animationName: "Lightning Rain",
        O: 0,
        P: 0,
        M: 7,
        N: 2
    },
    {
        animationName: "Pink Rain",
        O: 0,
        P: 3,
        M: 7,
        N: 5
    },
    {
        animationName: "Rainbow Rain",
        O: 0,
        P: 6,
        M: 7,
        N: 8
    }], 7), new Wb("spritesheet/DamageFX.png", 32, [{
        animationName: "Red Damage",
        O: 0,
        P: 0,
        M: 2,
        N: 0
    },
    {
        animationName: "White Damage",
        O: 0,
        P: 1,
        M: 2,
        N: 1
    },
    {
        animationName: "Blue Damage",
        O: 0,
        P: 2,
        M: 2,
        N: 2
    },
    {
        animationName: "Green Damage",
        O: 0,
        P: 3,
        M: 2,
        N: 3
    },
    {
        animationName: "Red Splat",
        O: 0,
        P: 4,
        M: 2,
        N: 4
    },
    {
        animationName: "Electric Damage",
        O: 0,
        P: 5,
        M: 2,
        N: 5
    },
    {
        animationName: "Fire Damage",
        O: 0,
        P: 6,
        M: 2,
        N: 6
    },
    {
        animationName: "Poison Damage",
        O: 0,
        P: 7,
        M: 2,
        N: 7
    },
    {
        animationName: "Sonic Damage",
        O: 0,
        P: 8,
        M: 2,
        N: 8
    },
    {
        animationName: "Pink Damage",
        O: 0,
        P: 9,
        M: 2,
        N: 9
    }], 2), new Wb("spritesheet/SpellFXMissiles.png", 31, [{
        animationName: "Red Arrow",
        O: 0,
        P: 0,
        M: 7,
        N: 0,
        zc: !0
    },
    {
        animationName: "Green Arrow",
        O: 0,
        P: 1,
        M: 7,
        N: 1,
        zc: !0
    },
    {
        animationName: "Pink Arrow",
        O: 0,
        P: 2,
        M: 7,
        N: 2,
        zc: !0
    },
    {
        animationName: "Pink Lightning",
        O: 0,
        P: 3,
        M: 7,
        N: 3,
        zc: !0
    },
    {
        animationName: "Green Projectile",
        O: 0,
        P: 4,
        M: 7,
        N: 4,
        zc: !0
    },
    {
        animationName: "Small Green Projectiles",
        O: 0,
        P: 5,
        M: 7,
        N: 5,
        zc: !0
    },
    {
        animationName: "Fire Projectile",
        O: 0,
        P: 6,
        M: 7,
        N: 6,
        zc: !0
    },
    {
        animationName: "Fire Arrow",
        O: 0,
        P: 7,
        M: 7,
        N: 7,
        zc: !0
    },
    {
        animationName: "Ice Projectile",
        O: 0,
        P: 8,
        M: 7,
        N: 8,
        zc: !0
    },
    {
        animationName: "Ice Arrow",
        O: 0,
        P: 9,
        M: 7,
        N: 9,
        zc: !0
    },
    {
        animationName: "Lightning",
        O: 0,
        P: 10,
        M: 7,
        N: 10,
        zc: !0
    },
    {
        animationName: "Lightning Arrow",
        O: 0,
        P: 11,
        M: 7,
        N: 11,
        zc: !0
    },
    {
        animationName: "Grey Bullet",
        O: 0,
        P: 12,
        M: 7,
        N: 12,
        zc: !0
    },
    {
        animationName: "Yellow Bullet",
        O: 0,
        P: 13,
        M: 7,
        N: 13,
        zc: !0
    },
    {
        animationName: "Ninja Star",
        O: 0,
        P: 14,
        M: 7,
        N: 14,
        zc: !0
    },
    {
        animationName: "Pink Star Projectile",
        O: 0,
        P: 15,
        M: 7,
        N: 15,
        zc: !0
    },
    {
        animationName: "Web",
        O: 0,
        P: 16,
        M: 7,
        N: 16,
        zc: !0
    },
    {
        animationName: "Pink Ball Projectile",
        O: 0,
        P: 17,
        M: 7,
        N: 17,
        zc: !0
    }], 7)]),
    vl: new
    function() {
        this.At = this.zt = this.wk = this.vk = 0
    },
    Qo: new mB,
    S: new ag,
    Gf: new Di,
    Ni: new lv,
    $h: new pi,
    Aa: new be,
    Pe: new
    function() {
        var a = zc,
        b = Ac;
        this.Eh = 16;
        this.Rh = a;
        this.Sh = b;
        this.sk = {};
        this.Mr = []
    },
    kb: new
    function() {
        this.pd = [];
        this.Jg = [];
        this.Dh = [];
        this.bm = {};
        this.Ny = "L2_Terrain087.PNG";
        this.ju = {};
        this.Uj = 1;
        this.cm = 0;
        this.GE = function(a, b) {
            return a.Jf < b.Jf ? -1 : 1
        }
    },
    Bm: new je,
    ug: new Ae,
    Ba: new ih,
    Mc: null,
    le: null,
    Hr: new sB,
    Ee: new ay,
    Nb: new
    function() {
        this.Po = this.bp = this.Jp = this.rq = this.up = this.nq = this.Mm = !0
    },
    Cz: new
    function() {},
    yE: new hh,
    ob: new
    function() {
        this.n = [];
        this.fc = this.hd = 1;
        this.en = {};
        this.HE = function(a, b) {
            var c = a.Vk(),
            d = b.Vk();
            return c < d ? -1 : c > d ? 1 : 0
        }
    },
    ff: new Ei,
    Uh: new Nq,
    Ti: new nr,
    th: new Ii,
    Sm: new Mv,
    dh: new Wv,
    Di: new ew,
    nh: new Qq,
    Yj: new pr,
    eq: new
    function() {
        this.yl = []
    },
    lD: new
    function() {
        this.dn = new Ci
    },
    df: new
    function() {
        this.Wg = []
    },
    Xe: new hw,
    RC: new
    function() {
        this.Wq = null
    },
    pc: new qh,
    dF: new
    function() {},
    pg: new
    function() {
        this.Zp = "C2_V1_001";
        this.qs = Ba();
        this.UC = 3E4;
        this.AE = new gB;
        this.eE = new cB
    },
    Em: !1,
    lg: !1,
    Fe: !1,
    Mh: !1,
    wb: !0,
    ig: !1,
    Tw: Date.now(),
    jf: 0,
    Vj: 0,
    Mz: !0,
    i: {
        $a: 0,
        Gj: 0,
        dz: 0,
        Xg: new vh,
        da: new lx,
        D: [],
        gg: null,
        ce: null,
        ae: new
        function() {
            this.An = this.Dd = 0;
            this.Qi = {};
            this.pj = {};
            var a, b = [];
            for (a = 0; a < Rr.length; a++) b.push(new Os(Rr[a]));
            this.tl = b
        },
        Ig: new
        function() {
            this.jj = [];
            this.Lt = {};
            this.ik = [];
            this.Ze = [];
            var a, b;
            for (a = 0; a < Vr.length; a++) b = new Wr(Vr[a]),
            this.jj.push(b),
            this.Lt[b.k] && console.log("Error. Duplicate achievement id: " + b.k),
            this.Lt[b.k] = b
        },
        Ih: new hx,
        Ua: new ix,
        aa: new jx,
        Bg: new
        function() {
            this.vn = this.mm = this.Xm = this.kn = this.jn = this.hn = 0;
            this.qo = {};
            this.lq = {};
            this.nm = 0
        },
        wh: 0
    },
    jE: function() {
        "undefined" !== typeof document.hidden && (w.Mz = !document.hidden)
    },
    CE: function() {
        document.addEventListener("visibilitychange", w.jE, !1)
    },
    onLoad: function() {
        w.CE();
        w.Hr.Hr()
    },
    eA: function() {
        var a = w.ob;
        a.en = {};
        a.hd = 1;
        a.fc = 1;
        a.n.length = 0;
        a.n.push({
            o: "棕色蝙蝠",
            d: "RatBrownDark.PNG"
        });
        a.n.push({
            o: "灰色蝙蝠",
            d: "RatGrey.PNG"
        });
        a.n.push({
            o: "实验蝙蝠",
            d: "RatWhite.PNG"
        });
        a.n.push({
            o: "绿色蜻蜓",
            d: "DragonFlyGreen.PNG"
        });
        a.n.push({
            o: "粉色蜻蜓",
            d: "DragonFlyPink.PNG"
        });
        a.n.push({
            o: "橙色蜻蜓",
            d: "DragonFlyOrange.PNG"
        });
        a.n.push({
            o: "黑色蜻蜓",
            d: "DragonFlyBlack.PNG"
        });
        a.n.push({
            o: "白色蜻蜓",
            d: "DragonFlyWhite.PNG"
        });
        a.n.push({
            o: "棕色蝙蝠",
            d: "BatBrown.PNG"
        });
        a.n.push({
            o: "蓝色蝙蝠",
            d: "BatBlueTail.PNG"
        });
        a.n.push({
            o: "灰色蝙蝠",
            d: "BatGrey.PNG"
        });
        a.n.push({
            o: "红色蝙蝠",
            d: "BatRedTail.PNG"
        });
        a.n.push({
            o: "银色蝙蝠",
            d: "BatSilver.PNG"
        });
        a.n.push({
            o: "蓝色蜈蚣",
            d: "CentipedeBlue.PNG"
        });
        a.n.push({
            o: "粉色蜈蚣",
            d: "CentipedePink.PNG"
        });
        a.n.push({
            o: "棕色蜈蚣",
            d: "CentipedeBrown.PNG"
        });
        a.n.push({
            o: "灰色蜈蚣",
            d: "CentipedeGrey.PNG"
        });
        a.n.push({
            o: "银色蜈蚣",
            d: "CentipedeSilver.PNG"
        });
        a.n.push({
            o: "猩红蜈蚣",
            d: "CentipedeRed.PNG"
        });
        a.n.push({
            o: "棕色蜥蜴",
            d: "LizardBrown.PNG"
        });
        a.n.push({
            o: "绿色蜥蜴",
            d: "LizardGreen.PNG"
        });
        a.n.push({
            o: "灰色蜥蜴",
            d: "LizardGrey.PNG"
        });
        a.n.push({
            o: "红色蜥蜴",
            d: "LizardRed.PNG"
        });
        a.n.push({
            o: "条纹蜥蜴",
            d: "LizardStriped.PNG"
        });
        a.n.push({
            o: "苍白爬行者",
            d: "CrawlerWhite.PNG"
        });
        a.n.push({
            o: "浅绿爬行者",
            d: "CrawlerBlueLight.PNG"
        });
        a.n.push({
            o: "蓝色爬行者",
            d: "CrawlerBlue.PNG"
        });
        a.n.push({
            o: "绿色爬行者",
            d: "CrawlerGreen.PNG"
        });
        a.n.push({
            o: "灰色爬行者",
            d: "CrawlerGrey.PNG"
        });
        a.n.push({
            o: "橙色爬行者",
            d: "CrawlerOrange.PNG"
        });
        a.n.push({
            o: "银色爬行者",
            d: "CrawlerSilver.PNG"
        });
        a.n.push({
            o: "红色爬行者",
            d: "CrawlerRed.PNG"
        });
        a.n.push({
            o: "棕色狗狗",
            d: "DogBrown.PNG"
        });
        a.n.push({
            o: "橙色狗狗",
            d: "DogOrange.PNG"
        });
        a.n.push({
            o: "灰色狗狗",
            d: "DogGrey.PNG"
        });
        a.n.push({
            o: "苍白狗狗",
            d: "DogWhite.PNG"
        });
        a.n.push({
            o: "阴影狗狗",
            d: "DogDarkGrey.PNG"
        });
        a.n.push({
            o: "粉色狗狗",
            d: "DogPink.PNG"
        });
        a.n.push({
            o: "蓝色蜘蛛",
            d: "SpiderBlue.PNG"
        });
        a.n.push({
            o: "黄金蜘蛛",
            d: "SpiderGold.PNG"
        });
        a.n.push({
            o: "绿色蜘蛛",
            d: "SpiderGreen.PNG"
        });
        a.n.push({
            o: "紫色蜘蛛",
            d: "SpiderPurple.PNG"
        });
        a.n.push({
            o: "红色蜘蛛",
            d: "SpiderRed.PNG"
        });
        a.n.push({
            o: "黑色蜘蛛",
            d: "SpiderBlack.PNG"
        });
        a.n.push({
            o: "巨型粉色青蛙",
            d: "FrogGiantPink.PNG"
        });
        a.n.push({
            o: "巨型绿色青蛙",
            d: "FrogGiantGreen.PNG"
        });
        a.n.push({
            o: "棕色巨蛇",
            d: "SnakeBrown.PNG"
        });
        a.n.push({
            o: "蓝色巨蛇",
            d: "SnakeBlue.PNG"
        });
        a.n.push({
            o: "绿色巨蛇",
            d: "SnakeGreen.PNG"
        });
        a.n.push({
            o: "灰色巨蛇",
            d: "SnakeGrey.PNG"
        });
        a.n.push({
            o: "粉色巨蛇",
            d: "SnakePink.PNG"
        });
        a.n.push({
            o: "银色巨蛇",
            d: "SnakeSilver.PNG"
        });
        a.n.push({
            o: "白色巨蛇",
            d: "SnakeWhite2.PNG"
        });
        a.n.push({
            o: "棕色活泥",
            d: "LivingMoundBrown.PNG"
        });
        a.n.push({
            o: "斑点活泥",
            d: "LivingMoundBrownGreen.PNG"
        });
        a.n.push({
            o: "肉体活泥",
            d: "LivingMoundFlesh.PNG"
        });
        a.n.push({
            o: "绿色活泥",
            d: "LivingMoundGreen.PNG"
        });
        a.n.push({
            o: "品红活泥",
            d: "LivingMoundMagenta.PNG"
        });
        a.n.push({
            o: "橙色活泥",
            d: "LivingMoundOrange.PNG"
        });
        a.n.push({
            o: "红色活泥",
            d: "LivingMoundRed.PNG"
        });
        a.n.push({
            o: "棕色乌龟",
            d: "TurtleBrown.PNG"
        });
        a.n.push({
            o: "蓝色乌龟",
            d: "TurtleBlue.PNG"
        });
        a.n.push({
            o: "绿色乌龟",
            d: "TurtleGreen.PNG"
        });
        a.n.push({
            o: "粉色乌龟",
            d: "TurtlePink.PNG"
        });
        a.n.push({
            o: "黄色乌龟",
            d: "TurtleYellow.PNG"
        });
        a.n.push({
            o: "灰色乌龟",
            d: "TurtleGrey.PNG"
        });
        a.n.push({
            o: "灰色幽灵",
            d: "Ghost3Grey.PNG"
        });
        a.n.push({
            o: "粉色幽灵",
            d: "Ghost3Pink.PNG"
        });
        a.n.push({
            o: "蓝色幽灵",
            d: "Ghost3Blue.PNG"
        });
        a.n.push({
            o: "绿色幽灵",
            d: "GhostGreen.PNG"
        });
        a.n.push({
            o: "红色幽灵",
            d: "GhostRed.PNG"
        });
        a.n.push({
            o: "黑色幽灵",
            d: "GhostBlack.PNG"
        });
        a.n.push({
            o: "蓝色浮眼",
            d: "FloatingEyeBlue.PNG"
        });
        a.n.push({
            o: "绿色浮眼",
            d: "FloatingEyeGreen.PNG"
        });
        a.n.push({
            o: "灰色浮眼",
            d: "FloatingEyeGrey.PNG"
        });
        a.n.push({
            o: "红色浮眼",
            d: "FloatingEyeRed.PNG"
        });
        a.n.push({
            o: "触手浮眼",
            d: "FloatingEyeTentacled3Eyes.PNG"
        });
        a.n.push({
            o: "成熟浮眼",
            d: "FloatingEyeTentacled6Eyes.PNG"
        });
        a.n.push({
            o: "青色水母",
            d: "JellyfishTeal.PNG"
        });
        a.n.push({
            o: "蓝色水母",
            d: "JellyfishBlue.PNG"
        });
        a.n.push({
            o: "棕色水母",
            d: "JellyfishBrown.PNG"
        });
        a.n.push({
            o: "绿色水母",
            d: "JellyfishGreen.PNG"
        });
        a.n.push({
            o: "灰色水母",
            d: "JellyfishGrey.PNG"
        });
        a.n.push({
            o: "橙色水母",
            d: "JellyfishOrange.PNG"
        });
        a.n.push({
            o: "粉色水母",
            d: "JellyfishPink.PNG"
        });
        a.n.push({
            o: "红色水母",
            d: "JellyfishRed.PNG"
        });
        a.n.push({
            o: "白色水母",
            d: "JellyfishWhite2.PNG"
        });
        a.n.push({
            o: "黄色水母",
            d: "JellyfishYellow.PNG"
        });
        a.n.push({
            o: "棕色霉菌",
            d: "MoldBrown.PNG"
        });
        a.n.push({
            o: "蓝色霉菌",
            d: "MoldBlue.PNG"
        });
        a.n.push({
            o: "灰色霉菌",
            d: "MoldBlueGrey.PNG"
        });
        a.n.push({
            o: "绿色霉菌",
            d: "MoldGreen.PNG"
        });
        a.n.push({
            o: "紫色霉菌",
            d: "MoldPurple.PNG"
        });
        a.n.push({
            o: "红色霉菌",
            d: "MoldRed.PNG"
        });
        a.n.push({
            o: "棕色眼镜蛇",
            d: "SnakeCobraBrown.PNG"
        });
        a.n.push({
            o: "绿色眼镜蛇",
            d: "SnakeCobraGreen.PNG"
        });
        a.n.push({
            o: "灰色眼镜蛇",
            d: "SnakeCobraGrey.PNG"
        });
        a.n.push({
            o: "红色眼镜蛇",
            d: "SnakeCobraRed.PNG"
        });
        a.n.push({
            o: "蓝色雪人",
            d: "YetiBlue.PNG"
        });
        a.n.push({
            o: "棕色雪人",
            d: "YetiBrown.PNG"
        });
        a.n.push({
            o: "绿色雪人",
            d: "YetiGreen.PNG"
        });
        a.n.push({
            o: "浅绿雪人",
            d: "YetiGreenBlue.PNG"
        });
        a.n.push({
            o: "灰色雪人",
            d: "YetiGreyDark.PNG"
        });
        a.n.push({
            o: "橙色雪人",
            d: "YetiOrange.PNG"
        });
        a.n.push({
            o: "粉色雪人",
            d: "YetiPink.PNG"
        });
        a.n.push({
            o: "黑色雪人",
            d: "YetiBlack.PNG"
        });
        a.n.push({
            o: "幼年蓝龙",
            d: "DragonBabyBlue.PNG"
        });
        a.n.push({
            o: "幼年青铜龙",
            d: "DragonBabyBronze.PNG"
        });
        a.n.push({
            o: "幼年黄金龙",
            d: "DragonBabyGold.PNG"
        });
        a.n.push({
            o: "幼年绿龙",
            d: "DragonBabyGreen.PNG"
        });
        a.n.push({
            o: "幼年彩虹龙",
            d: "DragonBabyRainbow.PNG"
        });
        a.n.push({
            o: "幼年银龙",
            d: "DragonBabySilver.PNG"
        });
        a.n.push({
            o: "幼年红龙",
            d: "DragonBabyRed.PNG"
        });
        a.n.push({
            o: "幼年黑龙",
            d: "DragonBabyBlack.PNG"
        });
        a.n.push({
            o: "蓝色龙人",
            d: "DragonManBlue.PNG"
        });
        a.n.push({
            o: "青铜龙人",
            d: "DragonManBronze.PNG"
        });
        a.n.push({
            o: "黄金龙人",
            d: "DragonManGold.PNG"
        });
        a.n.push({
            o: "绿色龙人",
            d: "DragonManGreen.PNG"
        });
        a.n.push({
            o: "彩虹龙人",
            d: "DragonManRainbow.PNG"
        });
        a.n.push({
            o: "银色龙人",
            d: "DragonManSilver.PNG"
        });
        a.n.push({
            o: "红色龙人",
            d: "DragonManRed.PNG"
        });
        a.n.push({
            o: "黑色龙人",
            d: "DragonManBlack.PNG"
        });
        a.n.push({
            o: "粉色木乃伊",
            d: "MummyPink.PNG"
        });
        a.n.push({
            o: "绿色木乃伊",
            d: "MummyGreen.PNG"
        });
        a.n.push({
            o: "灰色木乃伊",
            d: "MummyGrey.PNG"
        });
        a.n.push({
            o: "紫色木乃伊",
            d: "MummyPurple.PNG"
        });
        a.n.push({
            o: "红色木乃伊",
            d: "MummyRed.PNG"
        });
        a.n.push({
            o: "青色木乃伊",
            d: "MummyTeal.PNG"
        });
        a.n.push({
            o: "白色木乃伊",
            d: "MummyWhite.PNG"
        });
        a.n.push({
            o: "黑色木乃伊",
            d: "MummyYellow.PNG"
        });
        a.n.push({
            o: "棕色蝎子",
            d: "ScorpionBrown.PNG"
        });
        a.n.push({
            o: "蓝色蝎子",
            d: "ScorpionBlue.PNG"
        });
        a.n.push({
            o: "灰色蝎子",
            d: "ScorpionGrey.PNG"
        });
        a.n.push({
            o: "粉色蝎子",
            d: "ScorpionPink.PNG"
        });
        a.n.push({
            o: "绿色蝎子",
            d: "ScorpionGreenYellow.PNG"
        });
        a.n.push({
            o: "黑色蝎子",
            d: "ScorpionBlack.PNG"
        });
        a.n.push({
            o: "粉色恐龙",
            d: "DinosaurBeastGiantPink.PNG"
        });
        a.n.push({
            o: "棕色恐龙",
            d: "DinosaurBeastGiantBrown.PNG"
        });
        a.n.push({
            o: "黄色恐龙",
            d: "DinosaurBeastGiantYellow.PNG"
        });
        a.n.push({
            o: "绿色恐龙",
            d: "DinosaurBeastGiantGreen.PNG"
        });
        a.n.push({
            o: "灰色恐龙",
            d: "DinosaurBeastGiantGrey.PNG"
        });
        a.n.push({
            o: "红色恐龙",
            d: "DinosaurBeastGiantRed.PNG"
        });
        a.n.push({
            o: "青年蓝龙",
            d: "DragonYoungBlue.PNG"
        });
        a.n.push({
            o: "青年青铜龙",
            d: "DragonYoungBronze.PNG"
        });
        a.n.push({
            o: "青年黄金龙",
            d: "DragonYoungGold.PNG"
        });
        a.n.push({
            o: "青年绿龙",
            d: "DragonYoungGreen.PNG"
        });
        a.n.push({
            o: "青年彩虹龙",
            d: "DragonYoungRainbow.PNG"
        });
        a.n.push({
            o: "青年银龙",
            d: "DragonYoungSilver.PNG"
        });
        a.n.push({
            o: "青年红龙",
            d: "DragonYoungRed.PNG"
        });
        a.n.push({
            o: "青年黑龙",
            d: "DragonYoungBlack.PNG"
        });
        a.n.push({
            o: "黑色巨熊",
            d: "BlackBear.PNG"
        });
        a.n.push({
            o: "棕色巨熊",
            d: "BrownBear.PNG"
        });
        a.n.push({
            o: "灰色巨熊",
            d: "GrizzlyBear.PNG"
        });
        a.n.push({
            o: "气元素",
            d: "ElementalAir.PNG"
        });
        a.n.push({
            o: "水元素",
            d: "ElementalWater.PNG"
        });
        a.n.push({
            o: "土元素",
            d: "ElementalEarth.PNG"
        });
        a.n.push({
            o: "石元素",
            d: "ElementalStone.PNG"
        });
        a.n.push({
            o: "火元素",
            d: "ElementalFire.PNG"
        });
        a.n.push({
            o: "虚空元素",
            d: "ElementalVoid.PNG"
        });
        a.n.push({
            o: "僵尸",
            d: "Zombie.PNG"
        });
        a.n.push({
            o: "蓝色僵尸",
            d: "ZombieBlue.PNG"
        });
        a.n.push({
            o: "红色僵尸",
            d: "ZombieRed.PNG"
        });
        a.n.push({
            o: "水妖精",
            d: "SpriteWater.PNG"
        });
        a.n.push({
            o: "火妖精",
            d: "SpriteFire.PNG"
        });
        a.n.push({
            o: "棕色天使",
            d: "AngelBrown.PNG"
        });
        a.n.push({
            o: "紫色天使",
            d: "AngelPurple.PNG"
        });
        a.n.push({
            o: "蓝色天使",
            d: "AngelBlue.PNG"
        });
        a.n.push({
            o: "橙色天使",
            d: "AngelOrange.PNG"
        });
        a.n.push({
            o: "灰色天使",
            d: "AngelGrey.PNG"
        });
        a.n.push({
            o: "银色天使",
            d: "AngelSilver.PNG"
        });
        a.n.push({
            o: "猩红天使",
            d: "AngelRed.PNG"
        });
        a.n.push({
            o: "暗黑天使",
            d: "AngelGrey2.PNG"
        });
        a.n.push({
            o: "棕色鹰犬",
            d: "EagleHoundBrown.PNG"
        });
        a.n.push({
            o: "蓝色鹰犬",
            d: "EagleHoundBlue.PNG"
        });
        a.n.push({
            o: "黄金鹰犬",
            d: "EagleHoundGold.PNG"
        });
        a.n.push({
            o: "绿色鹰犬",
            d: "EagleHoundGreenDark.PNG"
        });
        a.n.push({
            o: "灰色鹰犬",
            d: "EagleHoundGrey.PNG"
        });
        a.n.push({
            o: "暗黑鹰犬",
            d: "EagleHoundGrey2.PNG"
        });
        a.n.push({
            o: "黑色鹰犬",
            d: "EagleHoundBlack.PNG"
        });
        a.n.push({
            o: "棕色两头蛇",
            d: "Hydra2HeadBrown.PNG"
        });
        a.n.push({
            o: "红色三头蛇",
            d: "Hydra3HeadRed.PNG"
        });
        a.n.push({
            o: "灰色四头蛇",
            d: "Hydra4HeadGrey.PNG"
        });
        a.n.push({
            o: "白色五头蛇",
            d: "Hydra5EyedWhite.PNG"
        });
        a.n.push({
            o: "黄色六头蛇",
            d: "Hydra6HeadYellow.PNG"
        });
        a.n.push({
            o: "灰色七头蛇",
            d: "Hydra7HeadGrey.PNG"
        });
        a.n.push({
            o: "紫色八头蛇",
            d: "Hydra8HeadPurple.PNG"
        });
        a.n.push({
            o: "绿色九头蛇",
            d: "Hydra9HeadedGreen.PNG"
        });
        a.n.push({
            o: "红色十头蛇",
            d: "Hydra10HeadRed.PNG"
        });
        a.n.push({
            o: "郊区居民",
            d: "People01.PNG"
        });
        a.n.push({
            o: "八旬老人",
            d: "People02.PNG"
        });
        a.n.push({
            o: "百岁老人",
            d: "People03.PNG"
        });
        a.n.push({
            o: "农民",
            d: "PeopleFarmer.PNG"
        });
        a.n.push({
            o: "驼背",
            d: "PeopleHunchback.PNG"
        });
        a.n.push({
            o: "粉色死亡蠕虫",
            d: "WormMassPinkGrey.PNG"
        });
        a.n.push({
            o: "蓝色死亡蠕虫",
            d: "WormMassBlue.PNG"
        });
        a.n.push({
            o: "绿色死亡蠕虫",
            d: "WormMassGreen.PNG"
        });
        a.n.push({
            o: "灰色死亡蠕虫",
            d: "WormMassGrey.PNG"
        });
        a.n.push({
            o: "红色死亡蠕虫",
            d: "WormMassRedPink.PNG"
        });
        a.n.push({
            o: "青色死亡蠕虫",
            d: "WormMassTeal.PNG"
        });
        a.n.push({
            o: "黄色死亡蠕虫",
            d: "WormMassYellow.PNG"
        });
        a.n.push({
            o: "蓝色鬼魂",
            d: "WraithBlue.PNG"
        });
        a.n.push({
            o: "绿色鬼魂",
            d: "WraithGreen.PNG"
        });
        a.n.push({
            o: "灰色鬼魂",
            d: "WraithGrey.PNG"
        });
        a.n.push({
            o: "橙色鬼魂",
            d: "WraithOrange.PNG"
        });
        a.n.push({
            o: "紫色鬼魂",
            d: "WraithPurple.PNG"
        });
        a.n.push({
            o: "红色鬼魂",
            d: "WraithRed.PNG"
        });
        a.n.push({
            o: "鬼魂领主",
            d: "WraithLord.PNG"
        });
        a.n.push({
            o: "鬼魂国王",
            d: "WraithKing.PNG"
        });
        a.n.push({
            o: "棕色软泥",
            d: "OozeBrown.PNG"
        });
        a.n.push({
            o: "蓝色软泥",
            d: "OozeBlue.PNG"
        });
        a.n.push({
            o: "绿色软泥",
            d: "OozeGreen.PNG"
        });
        a.n.push({
            o: "灰色软泥",
            d: "OozeGrey.PNG"
        });
        a.n.push({
            o: "黑色软泥",
            d: "OozeBlack.PNG"
        });
        a.n.push({
            o: "棕色蛇怪",
            d: "BasiliskBrown.PNG"
        });
        a.n.push({
            o: "绿色蛇怪",
            d: "BasiliskGreen.PNG"
        });
        a.n.push({
            o: "银色蛇怪",
            d: "BasiliskSilver.PNG"
        });
        a.n.push({
            o: "猩红蛇怪",
            d: "BasiliskRed.PNG"
        });
        a.n.push({
            o: "蓝龙",
            d: "DragonAdultBlue.PNG"
        });
        a.n.push({
            o: "青铜龙",
            d: "DragonAdultBronze.PNG"
        });
        a.n.push({
            o: "黄金龙",
            d: "DragonAdultGold.PNG"
        });
        a.n.push({
            o: "绿龙",
            d: "DragonAdultGreen.PNG"
        });
        a.n.push({
            o: "彩虹龙",
            d: "DragonAdultRainbow.PNG"
        });
        a.n.push({
            o: "银龙",
            d: "DragonAdultSilver.PNG"
        });
        a.n.push({
            o: "红龙",
            d: "DragonAdultRed.PNG"
        });
        a.n.push({
            o: "黑龙",
            d: "DragonAdultBlack.PNG"
        });
        a.n.push({
            o: "骷髅",
            d: "Skeleton.PNG"
        });
        a.n.push({
            o: "骷髅盗贼",
            d: "SkeletonFighter.PNG"
        });
        a.n.push({
            o: "骷髅恶魔",
            d: "SkeletonDemon.PNG"
        });
        a.n.push({
            o: "骷髅战士",
            d: "SkeletonFighter3.PNG"
        });
        a.n.push({
            o: "骷髅野蛮人",
            d: "SkeletonFighter13.PNG"
        });
        a.n.push({
            o: "骷髅刀锋战士",
            d: "SkeletonFighter6.PNG"
        });
        a.n.push({
            o: "骷髅恶魔战士",
            d: "SkeletonDemonFighter.PNG"
        });
        a.n.push({
            o: "绿色精灵",
            d: "SpiritGreen.PNG"
        });
        a.n.push({
            o: "棕色精灵",
            d: "SpiritBrown.PNG"
        });
        a.n.push({
            o: "土精灵",
            d: "SpiritEarth.PNG"
        });
        a.n.push({
            o: "气精灵",
            d: "SpiritAir.PNG"
        });
        a.n.push({
            o: "暗黑精灵",
            d: "SpiritGreyDark.PNG"
        });
        a.n.push({
            o: "火精灵",
            d: "SpiritFire.PNG"
        });
        a.n.push({
            o: "初拥吸血鬼",
            d: "Vampire2.PNG"
        });
        a.n.push({
            o: "吸血鬼",
            d: "Vampire3.PNG"
        });
        a.n.push({
            o: "长老吸血鬼",
            d: "Vampire4.PNG"
        });
        a.n.push({
            o: "远古吸血鬼",
            d: "VampireMage1.PNG"
        });
        a.n.push({
            o: "远古蓝龙",
            d: "DragonAncientBlue.PNG"
        });
        a.n.push({
            o: "远古青铜龙",
            d: "DragonAncientBronze.PNG"
        });
        a.n.push({
            o: "远古黄金龙",
            d: "DragonAncientGold.PNG"
        });
        a.n.push({
            o: "远古白龙",
            d: "DragonAncientGoldWhite.PNG"
        });
        a.n.push({
            o: "远古绿龙",
            d: "DragonAncientGreen.PNG"
        });
        a.n.push({
            o: "远古彩虹龙",
            d: "DragonAncientRainbow.PNG"
        });
        a.n.push({
            o: "远古银龙",
            d: "DragonAncientSilver.PNG"
        });
        a.n.push({
            o: "远古红龙",
            d: "DragonAncientRed.PNG"
        });
        a.n.push({
            o: "远古黑龙",
            d: "DragonAncientBlack.PNG"
        });
        a.n.push({
            o: "青色魔像",
            d: "GolemTeal.PNG"
        });
        a.n.push({
            o: "棕色魔像",
            d: "GolemBrown.PNG"
        });
        a.n.push({
            o: "蓝色魔像",
            d: "GolemBlue.PNG"
        });
        a.n.push({
            o: "灰色魔像",
            d: "GolemGrey.PNG"
        });
        a.n.push({
            o: "武装魔像",
            d: "GolemBrownStick.PNG"
        });
        a.n.push({
            o: "魔像领主",
            d: "GolemBrownCaped.PNG"
        });
        a.n.push({
            o: "电气魔像",
            d: "GolemElectric.PNG"
        });
        a.n.push({
            o: "幻象之眼",
            d: "PhantomEye.PNG"
        });
        a.n.push({
            o: "幻象之手",
            d: "PhantomHand.PNG"
        });
        a.n.push({
            o: "幻象之骨",
            d: "PhantomSkull.PNG"
        });
        a.n.push({
            o: "蓝色鬼怪",
            d: "SpectreBlue.PNG"
        });
        a.n.push({
            o: "绿色鬼怪",
            d: "SpectreGreen.PNG"
        });
        a.n.push({
            o: "橙色鬼怪",
            d: "SpectreOrange.PNG"
        });
        a.n.push({
            o: "紫色鬼怪",
            d: "SpectrePurple.PNG"
        });
        a.n.push({
            o: "银色鬼怪",
            d: "SpectreSilver.PNG"
        });
        a.n.push({
            o: "红色鬼怪",
            d: "SpectreRed.PNG"
        });
        a.n.push({
            o: "黑色鬼怪",
            d: "SpectreBlack.PNG"
        });
        a.n.push({
            o: "棕色骗子",
            d: "TricksterBrown.PNG"
        });
        a.n.push({
            o: "蓝色骗子",
            d: "TricksterBlue.PNG"
        });
        a.n.push({
            o: "绿色骗子",
            d: "TricksterGreen.PNG"
        });
        a.n.push({
            o: "黑色骗子",
            d: "TricksterBlack.PNG"
        });
        a.n.push({
            o: "红色骗子",
            d: "TricksterRed.PNG"
        });
        a.n.push({
            o: "魔术骗子",
            d: "TricksterPurpleMage.PNG"
        });
        a.n.push({
            o: "暗黑巨人",
            d: "TrollDark.PNG"
        });
        a.n.push({
            o: "巨人战士",
            d: "TrollFighter2.PNG"
        });
        a.n.push({
            o: "火巨人",
            d: "TrollFire.PNG"
        });
        a.n.push({
            o: "石巨人",
            d: "TrollGrey.PNG"
        });
        a.n.push({
            o: "水巨人",
            d: "TrollWater.PNG"
        });
        a.n.push({
            o: "巨人僵尸",
            d: "TrollZombie.PNG"
        });
        a.n.push({
            o: "巨人国王",
            d: "TrollKing.PNG"
        });
        a.n.push({
            o: "蓝龙领主",
            d: "DragonAncientLordBlue.PNG"
        });
        a.n.push({
            o: "青铜龙领主",
            d: "DragonAncientLordBronze.PNG"
        });
        a.n.push({
            o: "绿龙领主",
            d: "DragonAncientLordGreen.PNG"
        });
        a.n.push({
            o: "银龙领主",
            d: "DragonAncientLordSilver.PNG"
        });
        a.n.push({
            o: "红龙领主",
            d: "DragonAncientLordRed.PNG"
        });
        a.n.push({
            o: "黑龙领主",
            d: "DragonAncientLordBlack.PNG"
        });
        a.n.push({
            o: "恶魔龙领主",
            d: "DragonAncientLordSilverRed.PNG"
        });
        a.n.push({
            o: "巨型蓝蜉蝣",
            d: "DrakeGiantBlue.PNG"
        });
        a.n.push({
            o: "巨型青铜蜉蝣",
            d: "DrakeGiantBronze.PNG"
        });
        a.n.push({
            o: "巨型灰蜉蝣",
            d: "DrakeGiantGrey.PNG"
        });
        a.n.push({
            o: "巨型白蜉蝣",
            d: "DrakeGiantWhite.PNG"
        });
        a.n.push({
            o: "巨型红蜉蝣",
            d: "DrakeGiantRed.PNG"
        });
        a.n.push({
            o: "巨型血蜉蝣",
            d: "DrakeGiantRed2.PNG"
        });
        a.n.push({
            o: "巨型黑蜉蝣",
            d: "DrakeGiantBlack.PNG"
        });
        a.n.push({
            o: "骨龙",
            d: "DragonGiantBone.PNG"
        });
        a.n.push({
            o: "蓝色骨龙",
            d: "DragonGiantBoneBlue.PNG"
        });
        a.n.push({
            o: "绿色骨龙",
            d: "DragonGiantBoneGreen.PNG"
        });
        a.n.push({
            o: "灰色骨龙",
            d: "DragonGiantBoneGrey.PNG"
        });
        a.n.push({
            o: "红色骨龙",
            d: "DragonGiantBoneRed.PNG"
        });
        a.n.push({
            o: "冰霜巨人",
            d: "GiantFrost.PNG"
        });
        a.n.push({
            o: "山丘巨人",
            d: "GiantHill.PNG"
        });
        a.n.push({
            o: "风暴巨人",
            d: "GiantStorm.PNG"
        });
        a.n.push({
            o: "双头巨人",
            d: "GiantTwoHeaded.PNG"
        });
        a.n.push({
            o: "云层巨人",
            d: "GiantCloud.PNG"
        });
        a.n.push({
            o: "火焰巨人",
            d: "GiantFire.PNG"
        });
        a.n.push({
            o: "谋杀牛",
            d: "CowLeft.PNG"
        });
        a.n.push({
            o: "噩梦小鸡",
            d: "Chicken1.PNG"
        });
        a.n.push({
            o: "死亡小鸡",
            d: "Chicken2.PNG"
        });
        a.n.push({
            o: "灰色骷髅领主",
            d: "SkeletonFighterLord1.PNG"
        });
        a.n.push({
            o: "紫色骷髅领主",
            d: "SkeletonFighterLord2.PNG"
        });
        a.n.push({
            o: "蓝色骷髅领主",
            d: "SkeletonFighterLord3.PNG"
        });
        a.n.push({
            o: "橙色骷髅领主",
            d: "SkeletonFighterLord4.PNG"
        });
        a.n.push({
            o: "骷髅国王",
            d: "SkeletonKing.PNG"
        });
        var b = w.Sm;
        b.os = {};
        b.ps = {};
        var c = {
            fa: "剑",
            na: !0,
            oa: !1,
            ma: !1,
            la: !1,
            Z: ["20"]
        },
        d = {
            fa: "斧",
            na: !0,
            oa: !1,
            ma: !1,
            la: !1,
            Z: ["21"]
        },
        f = {
            fa: "锤",
            na: !0,
            oa: !1,
            ma: !1,
            la: !1,
            Z: ["21"]
        },
        g = {
            fa: "匕首",
            na: !0,
            oa: !1,
            ma: !1,
            la: !1,
            Z: ["24", "33"]
        },
        h = {
            fa: "连枷",
            na: !0,
            oa: !1,
            ma: !1,
            la: !1,
            Z: ["22", "20", "21"]
        },
        l = {
            fa: "权杖",
            na: !0,
            oa: !1,
            ma: !1,
            la: !1,
            Z: ["22", "20"]
        },
        n = {
            fa: "节杖",
            na: !0,
            oa: !1,
            ma: !1,
            la: !1,
            Z: ["32"]
        },
        p = {
            fa: "双节棍",
            na: !0,
            oa: !1,
            ma: !1,
            la: !1,
            Z: ["29"]
        },
        s = {
            fa: "棍棒",
            na: !1,
            oa: !1,
            ma: !1,
            la: !0,
            Z: ["26", "27", "28", "31"]
        },
        u = {
            fa: "镰刀",
            na: !0,
            oa: !1,
            ma: !1,
            la: !1,
            Z: ["30"]
        },
        y = {
            fa: "骨头",
            na: !1,
            oa: !1,
            ma: !1,
            la: !0,
            Z: ["201"]
        },
        A = {
            fa: "蜡烛",
            na: !1,
            oa: !1,
            ma: !1,
            la: !0,
            Z: ["203"]
        },
        C = {
            fa: "灯笼",
            na: !1,
            oa: !1,
            ma: !1,
            la: !0,
            Z: ["203"]
        },
        v = {
            fa: "灯",
            na: !1,
            oa: !1,
            ma: !1,
            la: !0,
            Z: ["203"]
        },
        D = {
            fa: "硬币",
            na: !1,
            oa: !1,
            ma: !1,
            la: !0,
            Z: ["205"]
        },
        N = {
            fa: "珠宝",
            na: !1,
            oa: !1,
            ma: !1,
            la: !0,
            Z: ["205"]
        },
        I = {
            fa: "弓",
            na: !1,
            oa: !1,
            ma: !1,
            la: !0,
            Z: ["23"]
        },
        x = {
            fa: "弩",
            na: !1,
            oa: !1,
            ma: !1,
            la: !0,
            Z: ["25"]
        },
        z = {
            fa: "箭矢",
            na: !1,
            oa: !0,
            ma: !1,
            la: !1,
            Xn: 1,
            Z: ["60"]
        },
        O = {
            fa: "闪电",
            na: !1,
            oa: !0,
            ma: !1,
            la: !1,
            Xn: 2,
            Z: ["61"]
        },
        J = {
            fa: "护盾",
            na: !1,
            oa: !1,
            ma: !0,
            la: !1,
            Z: ["40", "41"]
        },
        la = {
            fa: "链甲",
            na: !1,
            oa: !1,
            ma: !0,
            la: !1,
            Z: ["80", "82", "81"]
        },
        Q = {
            fa: "板甲",
            na: !1,
            oa: !1,
            ma: !0,
            la: !1,
            Z: ["80", "81"]
        },
        V = {
            fa: "板甲",
            na: !1,
            oa: !1,
            ma: !0,
            la: !1,
            Z: ["80", "82", "81"]
        },
        na = {
            fa: "皮甲",
            na: !1,
            oa: !1,
            ma: !0,
            la: !1,
            Z: ["84", "83"]
        },
        K = {
            fa: "项链",
            na: !1,
            oa: !1,
            ma: !1,
            la: !0,
            Z: "140 141 142 143 145 144".split(" ")
        },
        H = {
            fa: "戒指",
            na: !1,
            oa: !1,
            ma: !1,
            la: !0,
            Z: "160 161 162 163 164 165".split(" ")
        },
        S = {
            fa: "符号",
            na: !1,
            oa: !1,
            ma: !1,
            la: !0,
            Z: ["200"]
        },
        da = {
            fa: "蘑菇",
            na: !1,
            oa: !1,
            ma: !1,
            la: !0,
            Z: ["202", "204"]
        },
        W = {
            fa: "头盔",
            na: !1,
            oa: !1,
            ma: !0,
            la: !1,
            Z: ["120"]
        },
        ia = {
            fa: "王冠",
            na: !1,
            oa: !1,
            ma: !0,
            la: !1,
            Z: ["125"]
        },
        ea = {
            fa: "巫师帽",
            na: !1,
            oa: !1,
            ma: !0,
            la: !1,
            Z: ["121", "122", "123", "124"]
        },
        va = {
            fa: "手套",
            na: !1,
            oa: !1,
            ma: !0,
            la: !1,
            Z: ["100", "101", "102"]
        },
        yb = {
            fa: "长手套",
            na: !1,
            oa: !1,
            ma: !0,
            la: !1,
            Z: ["101", "102"]
        },
        Fb = {
            fa: "长袍",
            na: !1,
            oa: !1,
            ma: !0,
            la: !1,
            Z: ["85", "86", "87", "89", "91"]
        },
        pa = {
            fa: "斗篷",
            na: !1,
            oa: !1,
            ma: !0,
            la: !1,
            Z: "85 86 87 88 90 92".split(" ")
        },
        T = {
            fa: "魔杖",
            na: !1,
            oa: !1,
            ma: !1,
            la: !0,
            Z: ["26"]
        },
        X = {
            fa: "靴子",
            na: !1,
            oa: !1,
            ma: !0,
            la: !1,
            Z: "181 185 182 183 184 180 186".split(" ")
        },
        Ca = {
            fa: "腰带",
            na: !1,
            oa: !1,
            ma: !0,
            la: !1,
            Z: ["3", "4", "5", "6", "7"]
        };
        L(b, la, "ArmorChainMailRusty.PNG");
        L(b, la, "ArmorChainMail.PNG");
        L(b, la, "ArmorChainMailAugmented.PNG");
        L(b, la, "ArmorChainMailBar.PNG");
        L(b, la, "ArmorChainmailGolden.PNG");
        L(b, la, "ArmorChainmailGreen.PNG");
        L(b, la, "ArmorChainmailMithril.PNG");
        L(b, V, "ArmorLeatherScaleMail.PNG");
        L(b, V, "ArmorMetalScaleMail.PNG");
        L(b, V, "ArmorScalemailDragonGrey.PNG");
        L(b, V, "ArmorScalemailDragonDarkGrey.PNG");
        L(b, V, "ArmorScalemailDragonWhite.PNG");
        L(b, V, "ArmorScalemailDragonBlue.PNG");
        L(b, V, "ArmorScalemailDragonBronze.PNG");
        L(b, V, "ArmorScalemailDragonGolden.PNG");
        L(b, V, "ArmorScalemailDragonGreen.PNG");
        L(b, V, "ArmorScalemailDragonLightBlue.PNG");
        L(b, V, "ArmorScalemailDragonPurple.PNG");
        L(b, V, "ArmorScalemailDragonRed.PNG");
        L(b, V, "ArmorScalemailDragonYellow.PNG");
        L(b, V, "ArmorScalemailDragonRainbow.PNG");
        L(b, V, "ArmorScalemailDragonHellfire.PNG");
        L(b, Q, "ArmorPlatemailPartial.PNG");
        L(b, Q, "ArmorPlatemailFull.PNG");
        L(b, Q, "ArmorPlatemailRibbed.PNG");
        L(b, Q, "ArmorPlatemailEnhancedSteel.PNG");
        L(b, Q, "ArmorPlatemailEnhancedBrown.PNG");
        L(b, Q, "ArmorPlatemailEnhancedPurple.PNG");
        L(b, Q, "ArmorPlatemailEnhancedBlue.PNG");
        L(b, Q, "ArmorPlatemailEnhancedGreen.PNG");
        L(b, Q, "ArmorPlatemailEnhancedYellow.PNG");
        L(b, Q, "ArmorPlatemailStuddedGolden.PNG");
        L(b, Q, "ArmorPlatemailStuddedGreen.PNG");
        L(b, Q, "ArmorPlatemailMithril.PNG");
        L(b, Q, "ArmorPlatemailAdamantite.PNG");
        L(b, na, "ArmorLeatherSoft.PNG");
        L(b, na, "ArmorLeatherHard.PNG");
        L(b, na, "ArmorLeatherScaleMail.PNG");
        L(b, na, "ArmorLeatherHardStudded.PNG");
        L(b, na, "ArmorLeatherSoftStudded.PNG");
        L(b, c, "Sword01.PNG");
        L(b, c, "Sword02.PNG");
        L(b, c, "Sword03.PNG");
        L(b, c, "Sword04.PNG");
        L(b, c, "Sword05.PNG");
        L(b, c, "Sword06.PNG");
        L(b, c, "Sword07.PNG");
        L(b, c, "Sword08.PNG");
        L(b, c, "Sword09.PNG");
        L(b, c, "Sword10.PNG");
        L(b, c, "Sword11.PNG");
        L(b, c, "Sword12.PNG");
        L(b, c, "Sword13.PNG");
        L(b, c, "Sword14.PNG");
        L(b, c, "Sword15.PNG");
        L(b, c, "Sword16.PNG");
        L(b, c, "Sword17.PNG");
        L(b, c, "Sword18.PNG");
        L(b, c, "Sword19.PNG");
        L(b, c, "Sword20.PNG");
        L(b, c, "Sword21.PNG");
        L(b, c, "Sword22.PNG");
        L(b, c, "Sword23.PNG");
        L(b, c, "Sword24.PNG");
        L(b, c, "Sword25.PNG");
        L(b, c, "Sword26.PNG");
        L(b, c, "Sword27.PNG");
        L(b, c, "Sword28.PNG");
        L(b, c, "SwordFlaming.PNG");
        L(b, c, "SwordMagical.PNG");
        L(b, c, "SwordMedievalMagical.PNG");
        L(b, J, "ShieldWoodLarge.PNG");
        L(b, J, "ShieldWoodSmall.PNG");
        L(b, J, "ShieldWoodenRound.PNG");
        L(b, J, "ShieldSmallSteel.PNG");
        L(b, J, "ShieldSteelRoundLarge.PNG");
        L(b, J, "ShieldTriangular.PNG");
        L(b, J, "ShieldKiteRed.PNG");
        L(b, J, "Knight_Shield.PNG");
        L(b, J, "ShieldCrossed.PNG");
        L(b, J, "ShieldCrossRed.PNG");
        L(b, J, "DarkLord_Shield.PNG");
        L(b, J, "ShieldFourColoredBlueYellow.PNG");
        L(b, J, "ShieldFourColoredRedYellow.PNG");
        L(b, J, "ShieldFourColoredSilverYellow.PNG");
        L(b, J, "ShieldStripeRed.PNG");
        L(b, J, "ShieldColored1.PNG");
        L(b, J, "Valors_Shield.PNG");
        L(b, J, "DefenderShield01.PNG");
        L(b, J, "ShieldCrestedCrown.PNG");
        L(b, J, "ShieldCrestedGolden.PNG");
        L(b, J, "ShieldCrestedLion.PNG");
        L(b, J, "ShieldCrestedLion2.PNG");
        L(b, J, "ShieldCrestedSkull.PNG");
        L(b, J, "ShieldCrestedUnicorn.PNG");
        L(b, J, "ShieldCrestedUnicorn2.PNG");
        L(b, l, "Mace.PNG");
        L(b, l, "MaceWood.PNG");
        L(b, l, "Mace01.PNG");
        L(b, l, "Mace02.PNG");
        L(b, l, "Mace03.PNG");
        L(b, l, "Mace04.PNG");
        L(b, l, "Mace05.PNG");
        L(b, l, "Mace06.PNG");
        L(b, l, "Mace07.PNG");
        L(b, l, "Mace08.PNG");
        L(b, l, "MaceWar.PNG");
        L(b, l, "MaceGolden.PNG");
        L(b, l, "MaceMagic.PNG");
        L(b, h, "Flail01.PNG");
        L(b, h, "Flail02.PNG");
        L(b, h, "Flail03.PNG");
        L(b, h, "Flail04.PNG");
        L(b, h, "FlailSteel.PNG");
        L(b, h, "FlailTwoHanded.PNG");
        L(b, h, "FlailWood.PNG");
        L(b, h, "Flail05.PNG");
        L(b, h, "Flail06.PNG");
        L(b, h, "Flail07.PNG");
        L(b, h, "DoubleFlail01.PNG");
        L(b, h, "DoubleFlail02.PNG");
        L(b, h, "DoubleFlail03.PNG");
        L(b, d, "AxeBeaked.PNG");
        L(b, d, "AxeGlaive.PNG");
        L(b, d, "Axe01.PNG");
        L(b, d, "Axe02.PNG");
        L(b, d, "Axe03.PNG");
        L(b, d, "Axe04.PNG");
        L(b, d, "Axe05.PNG");
        L(b, d, "Axe06.PNG");
        L(b, d, "Axe07.PNG");
        L(b, d, "Axe08.PNG");
        L(b, d, "Axe09.PNG");
        L(b, d, "Axe10.PNG");
        L(b, d, "Axe11.PNG");
        L(b, d, "Axe12.PNG");
        L(b, d, "Axe13.PNG");
        L(b, d, "Axe14.PNG");
        L(b, d, "AxeBattle.PNG");
        L(b, d, "AxeBroad.PNG");
        L(b, d, "AxeGolden.PNG");
        L(b, d, "AxeGreat.PNG");
        L(b, d, "AxeLochaber.PNG");
        L(b, f, "Ahammer1.PNG");
        L(b, f, "Hammer01.PNG");
        L(b, f, "Hammer02.PNG");
        L(b, f, "Hammer03.PNG");
        L(b, f, "Hammer04.PNG");
        L(b, f, "Hammer05.PNG");
        L(b, f, "HammerGiant.PNG");
        L(b, f, "HammerGolden.PNG");
        L(b, f, "HammerLucerne.PNG");
        L(b, f, "HammerWar.PNG");
        L(b, g, "Dagger.PNG");
        L(b, g, "Dagger01.PNG");
        L(b, g, "Dagger02.PNG");
        L(b, g, "Dagger03.PNG");
        L(b, g, "Dagger04.PNG");
        L(b, g, "Dagger05.PNG");
        L(b, g, "Dagger06.PNG");
        L(b, g, "Dagger07.PNG");
        L(b, g, "Dagger08.PNG");
        L(b, g, "Dagger09.PNG");
        L(b, g, "Dagger10.PNG");
        L(b, g, "DaggerGauche.PNG");
        L(b, p, "Nunchaku.PNG");
        L(b, p, "NunchakuGolden.PNG");
        L(b, n, "Scepter01.PNG");
        L(b, n, "Scepter02.PNG");
        L(b, n, "Scepter03.PNG");
        L(b, n, "Scepter04.PNG");
        L(b, n, "Scepter05.PNG");
        L(b, n, "Scepter06.PNG");
        L(b, n, "Scepter07.PNG");
        L(b, n, "Scepter08.PNG");
        L(b, n, "Scepter09.PNG");
        L(b, n, "Scepter10.PNG");
        L(b, n, "Scepter11.PNG");
        L(b, n, "Scepter12.PNG");
        L(b, n, "Scepter13.PNG");
        L(b, n, "Scepter14.PNG");
        L(b, n, "Scepter15.PNG");
        L(b, n, "Scepter16.PNG");
        L(b, n, "Scepter17.PNG");
        L(b, n, "Scepter18.PNG");
        L(b, u, "Scythe01.PNG");
        L(b, u, "Scythe02.PNG");
        L(b, u, "ScytheSteel.PNG");
        L(b, u, "ScytheWood.PNG");
        L(b, s, "Staff01.PNG");
        L(b, s, "Staff02.PNG");
        L(b, s, "Staff03.PNG");
        L(b, s, "Staff04.PNG");
        L(b, s, "Staff05.PNG");
        L(b, s, "Staff06.PNG");
        L(b, s, "Staff07.PNG");
        L(b, s, "Staff08.PNG");
        L(b, s, "Staff09.PNG");
        L(b, s, "Staff10.PNG");
        L(b, s, "Staff11.PNG");
        L(b, s, "Staff12.PNG");
        L(b, s, "Staff13.PNG");
        L(b, s, "Staff14.PNG");
        L(b, s, "Staff15.PNG");
        L(b, s, "Staff16.PNG");
        L(b, s, "Staff17.PNG");
        L(b, s, "Staff18.PNG");
        L(b, s, "Staff19.PNG");
        L(b, s, "Staff20.PNG");
        L(b, s, "Staff21.PNG");
        L(b, s, "Staff22.PNG");
        L(b, s, "Staff23.PNG");
        L(b, s, "StaffBronze.PNG");
        L(b, s, "StaffDarkYellow.PNG");
        L(b, s, "StaffGold.PNG");
        L(b, s, "StaffGoldScales.PNG");
        L(b, s, "StaffGoldStriped.PNG");
        L(b, s, "StaffRedStriped.PNG");
        L(b, s, "StaffSilver.PNG");
        L(b, y, "SkeletonBrokenBone.PNG");
        L(b, y, "SkeletonDog.PNG");
        L(b, y, "SkeletonHumanSmall.PNG");
        L(b, y, "SkeletonRat.PNG");
        L(b, y, "SkeletonSkull.PNG");
        L(b, A, "CandleStand1.PNG");
        L(b, A, "CandleStand2.PNG");
        L(b, C, "Lantern.PNG");
        L(b, C, "LanternBronze.PNG");
        L(b, {
            fa: "火炬",
            na: !1,
            oa: !1,
            ma: !1,
            la: !0,
            Z: ["203"]
        },
        "Torch.PNG");
        L(b, v, "LightChalice.PNG");
        L(b, v, "LightOrb.PNG");
        L(b, v, "LightStar.PNG");
        L(b, D, "CoinsBronze.PNG");
        L(b, D, "CoinsGold.PNG");
        L(b, D, "CoinsGoldLarge.PNG");
        L(b, D, "CoinsGoldMedium.PNG");
        L(b, D, "CoinsGoldSmall.PNG");
        L(b, D, "CoinsGreen.PNG");
        L(b, D, "CoinsSilver.PNG");
        L(b, D, "CoinsTeal.PNG");
        L(b, N, "Jewels.PNG");
        L(b, N, "JewelsBlue.PNG");
        L(b, N, "JewelsRed.PNG");
        L(b, I, "BowShort.PNG");
        L(b, I, "Bow01.PNG");
        L(b, I, "Bow02.PNG");
        L(b, I, "Bow03.PNG");
        L(b, I, "Bow04.PNG");
        L(b, I, "Bow05.PNG");
        L(b, I, "Bow06.PNG");
        L(b, I, "Bow07.PNG");
        L(b, I, "Bow08.PNG");
        L(b, I, "Bow09.PNG");
        L(b, I, "Bow10.PNG");
        L(b, I, "BowLong.PNG");
        L(b, x, "Xbow01.PNG");
        L(b, x, "Xbow02.PNG");
        L(b, x, "Xbow03.PNG");
        L(b, x, "Xbow04.PNG");
        L(b, x, "Xbow05.PNG");
        L(b, x, "Xbow06.PNG");
        L(b, x, "Crossbow2.PNG");
        L(b, x, "CrossbowHeavy.PNG");
        L(b, x, "CrossbowLight.PNG");
        L(b, z, "ArrowWood.PNG");
        L(b, z, "ArrowSteel.PNG");
        L(b, z, "ArrowGolden.PNG");
        L(b, z, "ArrowSilver.PNG");
        L(b, z, "ArrowFlaming.PNG");
        L(b, z, "ArrowFlaming2.PNG");
        L(b, z, "ArrowMagicBlue.PNG");
        L(b, z, "ArrowMagicPurple.PNG");
        L(b, z, "ArrowPoisoned1.PNG");
        L(b, z, "ArrowPoisoned2.PNG");
        L(b, z, "ArrowPoisoned3.PNG");
        L(b, z, "ArrowPoisoned4.PNG");
        L(b, O, "BoltSteel.PNG");
        L(b, O, "BoltSilver.PNG");
        L(b, O, "BoltFlaming.PNG");
        L(b, O, "BoltFlaming2.PNG");
        L(b, O, "BoltGolden.PNG");
        L(b, O, "BoltMagicGreen.PNG");
        L(b, O, "BoltMagicRed.PNG");
        L(b, O, "BoltPoisoned.PNG");
        L(b, O, "BoltPoisoned2.PNG");
        L(b, O, "BoltPoisoned3.PNG");
        L(b, O, "BoltPoisoned4.PNG");
        L(b, O, "BoltWood.PNG");
        L(b, {
            fa: "星星",
            na: !1,
            oa: !0,
            ma: !1,
            la: !1,
            Xn: 3,
            Z: ["62"]
        },
        "ThrowingStar.PNG");
        L(b, K, "NecklaceJewelSilver5.PNG");
        L(b, K, "NecklaceSilverJewelGreen.PNG");
        L(b, K, "NecklaceSilverJewelOrange.PNG");
        L(b, K, "NecklaceBronzeJewelRed.PNG");
        L(b, K, "NecklaceGoldJewelBlue.PNG");
        L(b, K, "NecklaceGoldJewelGreen.PNG");
        L(b, K, "NecklaceGoldJewelSilver.PNG");
        L(b, K, "NecklaceGoldJewelSilver2.PNG");
        L(b, K, "NecklaceJewelBlue.PNG");
        L(b, K, "NecklaceJewelRed.PNG");
        L(b, K, "NecklaceJewelRed2.PNG");
        L(b, K, "NecklaceJewelRed3.PNG");
        L(b, K, "NecklaceJewelSilver.PNG");
        L(b, K, "NecklaceJewelSilver2.PNG");
        L(b, K, "NecklaceJewelSilver3.PNG");
        L(b, K, "NecklaceJewelSilver4.PNG");
        L(b, H, "RingBronze.PNG");
        L(b, H, "RingGold.PNG");
        L(b, H, "RingGoldJeweledBlue.PNG");
        L(b, H, "RingGoldJeweledRed.PNG");
        L(b, H, "RingGoldJeweledYellowMagic.PNG");
        L(b, H, "RingGoldMagic.PNG");
        L(b, H, "RingJewelBlack.PNG");
        L(b, H, "RingJewelBlue.PNG");
        L(b, H, "RingJeweledRed2.PNG");
        L(b, H, "RingJewelGreen.PNG");
        L(b, H, "RingJewelOrange.PNG");
        L(b, H, "RingJewelPurple.PNG");
        L(b, H, "RingJewelRed.PNG");
        L(b, H, "RingPlainGrey.PNG");
        L(b, H, "RingPlainSilver.PNG");
        L(b, H, "RingPurple.PNG");
        L(b, H, "RingSilverJeweledBlueMagic.PNG");
        L(b, H, "RingSilverJeweledGreen.PNG");
        L(b, H, "RingSilverJeweledGreenMagic.PNG");
        L(b, H, "RingSilverJeweledMagenta.PNG");
        L(b, H, "RingSilverJeweledPurple.PNG");
        L(b, H, "RingSilverJeweledRedMagic.PNG");
        L(b, H, "RingSilverJeweledSilver.PNG");
        L(b, H, "RingSilverJeweledSilver2.PNG");
        L(b, S, "GlyphGreen.PNG");
        L(b, S, "GlyphRed.PNG");
        L(b, S, "GlyphYellow.PNG");
        L(b, {
            fa: "面包",
            na: !1,
            oa: !1,
            ma: !1,
            la: !0,
            Z: ["204"]
        },
        "FoodBread.PNG");
        L(b, {
            fa: "啤酒",
            na: !1,
            oa: !1,
            ma: !1,
            la: !0,
            Z: ["204"]
        },
        "FoodAle.PNG");
        L(b, {
            fa: "鸡腿",
            na: !1,
            oa: !1,
            ma: !1,
            la: !0,
            Z: ["204"]
        },
        "FoodDrumstick.PNG");
        L(b, {
            fa: "火腿",
            na: !1,
            oa: !1,
            ma: !1,
            la: !0,
            Z: ["204"]
        },
        "FoodShank.PNG");
        L(b, da, "FoodMushroomBlack.PNG");
        L(b, da, "FoodMushroomBlue.PNG");
        L(b, da, "FoodMushroomBrown.PNG");
        L(b, da, "FoodMushroomGreen.PNG");
        L(b, da, "FoodMushroomGreen2.PNG");
        L(b, da, "FoodMushroomGrey.PNG");
        L(b, da, "FoodMushroomGrey2.PNG");
        L(b, da, "FoodMushroomOrange.PNG");
        L(b, da, "FoodMushroomPurple.PNG");
        L(b, da, "FoodMushroomRed.PNG");
        L(b, da, "FoodMushroomRed2.PNG");
        L(b, da, "FoodMushroomSilver.PNG");
        L(b, da, "FoodMushroomTan.PNG");
        L(b, da, "FoodMushroomTeal.PNG");
        L(b, da, "FoodMushroomWhite.PNG");
        L(b, da, "FoodMushroomYellow.PNG");
        L(b, W, "CapIron.PNG");
        L(b, W, "CapLeather.PNG");
        L(b, W, "CapLeatherHard.PNG");
        L(b, W, "CapMetal.PNG");
        L(b, W, "CapSteel.PNG");
        L(b, W, "Valors_Helm.PNG");
        L(b, W, "Knight_Helm.PNG");
        L(b, W, "DarkLord_Helm.PNG");
        L(b, W, "GuardHelm01.PNG");
        L(b, W, "HelmHorned.PNG");
        L(b, W, "CapGolden.PNG");
        L(b, ia, "CrownGolden.PNG");
        L(b, ia, "CrownIron.PNG");
        L(b, ia, "CrownIronJeweled.PNG");
        L(b, ia, "CrownJeweled.PNG");
        L(b, ia, "CrownOfTheMagi.PNG");
        L(b, ia, "CapGolden.PNG");
        L(b, ea, "WizardHat01.PNG");
        L(b, ea, "WizardHat02.PNG");
        L(b, ea, "WizardHat03.PNG");
        L(b, ea, "WizardHat04.PNG");
        L(b, ea, "WizardHat05.PNG");
        L(b, va, "GlovesLeatherHard.PNG");
        L(b, va, "GlovesLeatherSoft.PNG");
        L(b, va, "GlovesSteel.PNG");
        L(b, va, "GlovesGolden.PNG");
        L(b, va, "GlovesGreen.PNG");
        L(b, va, "GlovesSteelBlue.PNG");
        L(b, yb, "Valors_Gauntlets.PNG");
        L(b, yb, "Knight_Gauntlets.PNG");
        L(b, yb, "DarkLord_Gauntlets.PNG");
        L(b, Fb, "RobeBlue.PNG");
        L(b, Fb, "RobeGreen.PNG");
        L(b, Fb, "RobePurple.PNG");
        L(b, Fb, "RobeRed.PNG");
        L(b, pa, "CloakBlue.PNG");
        L(b, pa, "CloakBrown.PNG");
        L(b, pa, "CloakDarkGrey.PNG");
        L(b, pa, "CloakGreen.PNG");
        L(b, pa, "CloakLightBlue.PNG");
        L(b, pa, "CloakPurple.PNG");
        L(b, pa, "CloakRed.PNG");
        L(b, pa, "CloakSilver.PNG");
        L(b, pa, "CloakWhite.PNG");
        L(b, T, "Wand01.PNG");
        L(b, T, "Wand02.PNG");
        L(b, T, "Wand03.PNG");
        L(b, T, "Wand04.PNG");
        L(b, T, "Wand05.PNG");
        L(b, T, "Wand06.PNG");
        L(b, T, "Wand07.PNG");
        L(b, T, "Wand08.PNG");
        L(b, T, "Wand09.PNG");
        L(b, T, "Wand10.PNG");
        L(b, T, "Wand11.PNG");
        L(b, T, "Wand12.PNG");
        L(b, T, "Wand13.PNG");
        L(b, T, "Wand14.PNG");
        L(b, T, "Wand15.PNG");
        L(b, T, "Wand16.PNG");
        L(b, T, "Wand17.PNG");
        L(b, T, "Wand18.PNG");
        L(b, T, "Wand19.PNG");
        L(b, T, "WandBronzeGold.PNG");
        L(b, T, "WandBronzeRed.PNG");
        L(b, T, "WandBronzeSilver.PNG");
        L(b, T, "WandGold.PNG");
        L(b, T, "WandSilver.PNG");
        L(b, T, "WandSilverBronze.PNG");
        L(b, T, "WandSilverGold.PNG");
        L(b, T, "WandSilverTeal.PNG");
        L(b, T, "WandTeal.PNG");
        L(b, X, "BootsLeatherHard.PNG");
        L(b, X, "BootsLeatherSoft.PNG");
        L(b, X, "Warmboots01.PNG");
        L(b, X, "Warmboots02.PNG");
        L(b, X, "Warmboots03.PNG");
        L(b, X, "Warmboots04.PNG");
        L(b, X, "Warmboots05.PNG");
        L(b, X, "NewBoots01.PNG");
        L(b, X, "NewBoots02.PNG");
        L(b, X, "NewBoots03.PNG");
        L(b, X, "NewBoots04.PNG");
        L(b, X, "NewBoots05.PNG");
        L(b, X, "NewBoots06.PNG");
        L(b, X, "BootsGreen.PNG");
        L(b, X, "BootsMetal.PNG");
        L(b, X, "Knight_Boots.PNG");
        L(b, X, "DarkLord_Boots.PNG");
        L(b, X, "BootsGolden.PNG");
        L(b, X, "Valors_Boots.PNG");
        L(b, Ca, "Belt1.PNG");
        L(b, Ca, "DarkLord_Belt.PNG");
        L(b, Ca, "Belt2.PNG");
        L(b, Ca, "Belt3.PNG");
        L(b, Ca, "Belt4.PNG");
        L(b, Ca, "Valors_Belt.PNG");
        L(b, Ca, "Knight_Belt.PNG");
        L(b, {
            fa: "虚拟伤害",
            na: !1,
            oa: !0,
            ma: !1,
            la: !1,
            Z: ["230"]
        },
        "Spear.PNG");
        L(b, {
            fa: "虚拟护甲",
            na: !1,
            oa: !1,
            ma: !1,
            la: !0,
            Z: ["231"]
        },
        "Spear.PNG");
        L(b, {
            fa: "虚拟攻击等级",
            na: !1,
            oa: !1,
            ma: !1,
            la: !0,
            Z: ["232"]
        },
        "Spear.PNG");
        L(b, {
            fa: "虚拟防御等级",
            na: !1,
            oa: !1,
            ma: !1,
            la: !0,
            Z: ["233"]
        },
        "Spear.PNG");
        L(b, {
            fa: "虚拟最大生命",
            na: !1,
            oa: !1,
            ma: !1,
            la: !0,
            Z: ["234"]
        },
        "Spear.PNG");
        L(b, {
            fa: "虚拟最大法力",
            na: !1,
            oa: !1,
            ma: !1,
            la: !0,
            Z: ["235"]
        },
        "Spear.PNG");
        var qa = w.ff;
        qa.Sz = w.Kj.v("CoinsGoldSmall.PNG");
        qa.xw = w.Kj.v("CoinsGoldMedium.PNG");
        qa.wD = w.Kj.v("CoinsGoldLarge.PNG");
        Rq();
        qr();
        var ta = w.th;
        ta.ve.push({
            uh: "chest1",
            Mf: 1,
            jh: !1,
            xh: {
                Ec: w.I.v("L2_Chest02.PNG"),
                closed: w.I.v("L2_Chest01.PNG")
            },
            hh: {
                Ec: w.I.v("L2_Chest04.PNG"),
                closed: w.I.v("L2_Chest03.PNG")
            }
        });
        ta.ve.push({
            uh: "chest2",
            Mf: 1,
            jh: !1,
            xh: {
                Ec: w.I.v("L2_Chest06.PNG"),
                closed: w.I.v("L2_Chest05.PNG")
            },
            hh: {
                Ec: w.I.v("L2_Chest08.PNG"),
                closed: w.I.v("L2_Chest07.PNG")
            }
        });
        ta.ve.push({
            uh: "chest3",
            Mf: 1,
            jh: !1,
            xh: {
                Ec: w.I.v("L2_Chest10.PNG"),
                closed: w.I.v("L2_Chest09.PNG")
            },
            hh: {
                Ec: w.I.v("L2_Chest12.PNG"),
                closed: w.I.v("L2_Chest11.PNG")
            }
        });
        ta.ve.push({
            uh: "chest4",
            Mf: 1,
            jh: !1,
            xh: {
                Ec: w.I.v("L2_Chest14.PNG"),
                closed: w.I.v("L2_Chest13.PNG")
            },
            hh: {
                Ec: w.I.v("L2_Chest16.PNG"),
                closed: w.I.v("L2_Chest15.PNG")
            }
        });
        ta.ve.push({
            uh: "rack1",
            Mf: 2,
            jh: !0,
            xh: {
                Ec: w.I.v("L3_Wall_WeapRack1_EW.PNG"),
                closed: w.I.v("L3_Wall_WeapRack2_EW.PNG")
            },
            hh: {
                Ec: w.I.v("L3_Wall_WeapRack1_NS.PNG"),
                closed: w.I.v("L3_Wall_WeapRack2_NS.PNG")
            }
        });
        ta.ve.push({
            uh: "rack2",
            Mf: 2,
            jh: !0,
            xh: {
                Ec: w.I.v("L3_Wall_WeapRack1_EW.PNG"),
                closed: w.I.v("L3_Wall_WeapRack3_EW.PNG")
            },
            hh: {
                Ec: w.I.v("L3_Wall_WeapRack1_NS.PNG"),
                closed: w.I.v("L3_Wall_WeapRack3_NS.PNG")
            }
        });
        ta.ve.push({
            uh: "rack3",
            Mf: 2,
            jh: !0,
            xh: {
                Ec: w.I.v("L3_Wall_WeapRack1_EW.PNG"),
                closed: w.I.v("L3_Wall_WeapRack4_EW.PNG")
            },
            hh: {
                Ec: w.I.v("L3_Wall_WeapRack1_NS.PNG"),
                closed: w.I.v("L3_Wall_WeapRack4_NS.PNG")
            }
        });
        ta.ve.push({
            uh: "rack4",
            Mf: 2,
            jh: !0,
            xh: {
                Ec: w.I.v("L3_Wall_WeapRack5_EW.PNG"),
                closed: w.I.v("L3_Wall_WeapRack6_EW.PNG")
            },
            hh: {
                Ec: w.I.v("L3_Wall_WeapRack5_NS.PNG"),
                closed: w.I.v("L3_Wall_WeapRack6_NS.PNG")
            }
        });
        ta.ve.push({
            uh: "case1",
            Mf: 3,
            jh: !0,
            xh: {
                Ec: w.I.v("L3_WallDeco04.PNG"),
                closed: w.I.v("L3_WallDeco04.PNG")
            },
            hh: {
                Ec: w.I.v("L3_WallDeco03.PNG"),
                closed: w.I.v("L3_WallDeco03.PNG")
            }
        });
        ta.ve.push({
            uh: "case2",
            Mf: 3,
            jh: !0,
            xh: {
                Ec: w.I.v("L3_WallDeco14.PNG"),
                closed: w.I.v("L3_WallDeco14.PNG")
            },
            hh: {
                Ec: w.I.v("L3_WallDeco13.PNG"),
                closed: w.I.v("L3_WallDeco13.PNG")
            }
        });
        var eb = w.Pe;
        eb.sk = {};
        eb.Mr.length = 0;
        var Gb = eb.Eh,
        Da, ub, mb, Ea, La, wa, Fa;
        Ea = eb.Rh;
        for (Da = 0; Da < Gb; Da++, Ea++) {
            mb = [];
            La = eb.Sh;
            for (ub = 0; ub < Gb; ub++, La++) wa = Ea + "_" + La,
            Fa = new Hc(wa, Ea, La),
            mb.push(Fa),
            eb.sk[wa] = Fa;
            eb.Mr.push(mb)
        }
        var ha = w.kb;
        ha.pd.length = 0;
        ha.Jg.length = 0;
        ha.Dh.length = 0;
        ha.bm = {};
        ha.cm = 0;
        ha.Uj = 1;
        var ja = new Qc,
        Ga = new ga(11),
        bb = new Bc(Ga),
        za,
        nb,
        fb,
        cb = ja.BA,
        Ua = ja.EA,
        Va = xc / 2 | 0,
        mc = yc / 2 | 0,
        vb = {},
        Sb = 0,
        Ma = w.Pe.Eh,
        zb = Ma * Ma,
        Hb,
        ac,
        ob,
        pb,
        Ha,
        jb,
        Ab = {},
        Bb = [];
        for (za = 0; 35 > za; za++) {
            pb = 1;
            Hb = cb + ma(Ga, Ma);
            ac = Ua + ma(Ga, Ma);
            for (ob = Hb + "_" + ac; vb[ob];) pb++,
            Hb = cb + ma(Ga, Ma),
            ac = Ua + ma(Ga, Ma),
            ob = Hb + "_" + ac;
            vb[ob] = !0;
            for (Ha = Cc(bb, 11); Ab[Ha];) Ha = Cc(bb, 11);
            Ab[Ha] = !0;
            nb = Hb * xc + Va;
            fb = ac * yc + mc;
            nb += ma(Ga, 6) - 3;
            fb += ma(Ga, 6) - 3;
            jb = new Ic(ob, Ha, Hb, ac, nb, fb);
            Bb.push(jb);
            var qb = jb,
            wb = w.Pe.sk[ob];
            qb.ck.push(wb);
            wb.cu = qb;
            Sb++
        }
        for (var Ib, Ec = 0; Sb < zb;) {
            for (za = 0; za < Bb.length; za++) {
                jb = Bb[za];
                a: {
                    for (var bc = ja,
                    Wa = vb,
                    cc = Ga,
                    Qa = jb.ck,
                    nc = void 0,
                    sa = void 0,
                    sa = 0; sa < Qa.length; sa++) if (nc = Yc(bc, Qa[sa], Wa, cc)) {
                        Ib = nc;
                        break a
                    }
                    Ib = null
                }
                if (Ib) {
                    var Tb = jb,
                    qc = Ib;
                    Tb.ck.push(qc);
                    qc.cu = Tb;
                    vb[Ib.io] = !0;
                    Sb++
                }
            }
            Ec++
        }
        ha.pd = Bb;
        var Fc, Cb, kb, Ra;
        for (Fc = 0; Fc < ha.pd.length; Fc++) for (kb = ha.pd[Fc], ha.bm[kb.lo] && console.log("duplicate castle id: " + kb.lo), ha.bm[kb.lo] = kb, Ra = kb.ck, Cb = 0; Cb < Ra.length; Cb++) ha.ju[Ra[Cb].io] && console.log("duplicate castle owner: " + Ra[Cb].io),
        ha.ju[Ra[Cb].io] = kb;
        var Ja = w.Aa;
        Ja.Ab.length = 0;
        Ja.uj.length = 0;
        Ja.Ge.length = 0;
        Ja.ze.length = 0;
        Ja.dg.length = 0;
        Ja.Mk = 0;
        Ja.bk.length = 0;
        Ja.Sd = 0;
        Ja.Do = {};
        var Db, gb = new ga(1),
        rb = new Bc(gb),
        dc = w.kb.pd,
        Ka,
        Xa,
        hb,
        lb,
        rc,
        sc,
        Aa,
        db,
        Mc,
        ec,
        Ub,
        sb,
        ka,
        Eb,
        xb = {},
        Na = [];
        for (ka = 0; ka < dc.length; ka++) for (Ka = dc[ka], Xa = Ka.ck, sc = Ka.dm, Aa = Ka.em, Eb = 0; Eb < Xa.length; Eb++) if (db = Xa[Eb].Hd, Mc = Xa[Eb].Id, !(0.7 < gb.random())) {
            ec = 1 + db * xc + ma(gb, xc - 1);
            for (Ub = 1 + Mc * yc + ma(gb, yc - 1); ec === sc && Ub === Aa;) ec = 1 + db * xc + ma(gb, xc - 1),
            Ub = 1 + Mc * yc + ma(gb, yc - 1);
            lb = ae(gb);
            for (hb = Cc(rb, lb); xb[hb];) hb = Cc(rb, lb);
            xb[hb] = !0;
            Db = db + "_" + Mc;
            rc = 3 + ma(gb, 4);
            sb = new Gd(Db, hb, lb, ec, Ub, db, Mc, rc, Ka);
            Na.push(sb);
            Ka.Ab.push(sb)
        }
        Ja.Ab = Na;
        var Ya, tc;
        for (Ya = 0; Ya < Ja.Ab.length; Ya++) tc = Ja.Ab[Ya],
        Ja.Do[tc.ag] = tc;
        fe(Ja, Ja.Ab);
        ke();
        Be();
        Sr();
        es();
        w.Mh = !1;
        w.Em = !0;
        kx()
    },
    ix: function(a) {
        w.i.$a = 0;
        Id();
        w.i.da = new lx;
        w.i.D.length = 0;
        w.i.gg = null;
        w.i.ce = null;
        w.lg = !1;
        w.Fe = !1;
        if (a) {
            w.i.Ih = new hx;
            w.i.Ua = new ix;
            kx();
            var b = w.i.Bg;
            b.hn = 0;
            b.jn = 0;
            b.kn = 0;
            b.Xm = 0;
            b.mm = 0;
            b.vn = 0;
            b.qo = {};
            b.lq = {};
            b.nm = 0;
            Sr();
            es()
        }
        w.i.Ih.jx();
        w.Mh = !1;
        w.wb = !0;
        w.S = new ag;
        w.Ba = new ih;
        w.Mc = null;
        w.le = null;
        $d();
        b = w.Di;
        0 < b.Fj.length && (b.Fj.length = 0);
        Rq();
        qr();
        kh();
        de();
        Zc();
        ke();
        Be();
        iw();
        oc();
        for (b = 0; b < Nx.length; b++) js(Nx[b]);
        for (var c, b = 0; b < w.i.D.length; b++) c = w.i.D[b],
        js(c.ei),
        js(c.fi),
        js(c.gi),
        js(c.hi);
        w.$h.Pf.length = 0;
        lh();
        mv();
        b = w.ob;
        b.hd = 1;
        b.fc = 1;
        b.en = {};
        a && (w.i.wh = 0)
    },
    wE: function() {
        w.i.$a = 0;
        Id();
        var a = w.i.da;
        a.Wb = null;
        a.ge = null;
        a.Lf = null;
        a.Wf = null;
        a.Ue = null;
        a.Cc = null;
        a.Bc = null;
        a.ed = null;
        a.Ks = !1;
        a.gn = null;
        a.Mp = !1;
        a.hp = !1;
        a.Nm = 0;
        a.Om = 0;
        w.Fe = !1;
        w.i.Ih.jx();
        w.Mh = !1;
        w.wb = !0;
        w.S = new ag;
        w.Ba = new ih;
        w.Mc = null;
        w.le = null;
        qr();
        $d();
        kh();
        a = w.Aa.dg.length;
        de();
        w.Aa.Mk = a;
        a = w.kb.Uj;
        Zc();
        w.kb.Uj = a;
        ke();
        Be();
        iw();
        oc();
        w.$h.Pf.length = 0;
        lh();
        mv();
        for (var b, a = 0; a < w.i.D.length; a++) if (b = w.i.D[a], b.yg = null, b.En = null, b.Da = null, b.rh = null, b.Zh = null, b.hk = null, b.bj = null, b.Ue = null, b.ld = null, b.au = -3 * Mw(b.K, !0), b.gk && 0 < b.gk.length) for (var c = void 0,
        c = 0; c < b.gk.length; c++) vq(b.gk[c])
    },
    kD: function() { ! w.Fe && w.lg && (w.jf = Math.min(w.jf, 432E5 + Vs.t), w.ig = !0, w.Vj = 0)
    },
    xu: function() {
        w.ig = !1;
        w.Vj = 0;
        w.jf = 0;
        w.Ee.Ne()
    },
    Kw: function() {
        var a;
        for (a = 0; a < Nx.length; a++) ks(Nx[a]);
        var b;
        for (a = 0; a < w.i.D.length; a++) b = w.i.D[a],
        ks(b.ei),
        ks(b.fi),
        ks(b.gi),
        ks(b.hi);
        for (a = 0; a < w.i.D.length; a++) Mi(w.i.D[a]);
        w.Nb.Jp && w.Tw && (w.jf = Date.now() - w.Tw, 12E4 < w.jf && w.kD())
    },
    hE: function(a) {
        var b = w.pg;
        Ta("SaveManager", "Import");
        return kB(b, a) ? (w.lg && w.Ee.J(), w.ig && w.Ee.Zd(), w.Fe && w.Ee.Me(), px(w.pg), !0) : !1
    },
    iE: function() {
        px(w.pg)
    },
    OA: function() {
        w.i.Bg.nm = 0;
        w.i.Bg.mm = 0;
        w.ix(!1);
        jB();
        px(w.pg);
        w.Ee.Js()
    },
    gE: function() {
        w.ix(!0);
        jB();
        px(w.pg);
        w.Ee.Js()
    }
};
// 遗留实现的唯一出口。产品代码只依赖 adapter.js。
export const legacy = { game: w, classes: av, partyBonus: Rs, statValue: $h, serialize: () => vz(w.pg), decode: fa.eD, encode: fa.cD, snapshot: () => lB(w.pg), importSave: value => w.hE(value), setPersistence: value => { persistence = value; } };
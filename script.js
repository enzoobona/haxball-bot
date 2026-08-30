import "dotenv/config";
import HaxballJS from "haxball.js";

HaxballJS().then((HBInit) => {
    // ============================================================
    // ROOM
    // ============================================================

    const room = HBInit({
        roomName: "My room",
        public: false,
        maxPlayers: 16,
        noPlayer: true,
        token: process.env.HAXBALL_TOKEN
    });

    const stadium = `{"name":"namajunas futsal","width":648,"height":270,"bg":{"type":"none","color":"484848","cornerRadius":0,"kickOffRadius":0},"vertexes":[{"x":550,"y":240,"cMask":["ball"]},{"x":550,"y":-240,"cMask":["ball"]},{"x":-550,"y":-80,"bCoef":0.1,"cMask":["ball"],"color":"ffffff","_length":9},{"x":-550,"y":80,"bCoef":0.1,"cMask":["ball"],"color":"ffffff","_length":9},{"x":550,"y":-80,"bCoef":0.1,"cMask":["ball","red","blue"],"color":"ffffff","strength":0.1,"_length":9},{"x":550,"y":80,"bCoef":0.1,"cMask":["ball","red","blue"],"color":"ffffff","strength":0.1,"_length":9},{"x":-550,"y":80,"bCoef":1,"cMask":["ball"],"color":"D5E0ED","_length":9,"bias":50},{"x":-550,"y":240,"bCoef":1,"cMask":["ball"],"color":"D5E0ED","bias":50},{"x":-550,"y":-80,"bCoef":1,"cMask":["ball"],"color":"D5E0ED","_length":9,"bias":-50},{"x":-550,"y":-240,"bCoef":1,"cMask":["ball"],"color":"D5E0ED","_length":9,"bias":-50},{"x":-550,"y":240,"bCoef":1,"cMask":["ball"],"color":"D5E0ED"},{"x":550,"y":240,"bCoef":1,"cMask":["ball"],"color":"D5E0ED"},{"x":550,"y":80,"bCoef":1,"cMask":["ball","red","blue"],"color":"D5E0ED","strength":0.1,"_length":9,"bias":-50},{"x":550,"y":240,"bCoef":1,"cMask":["ball"],"color":"D5E0ED","bias":-50},{"x":550,"y":-240,"bCoef":1,"cMask":["ball"],"color":"D5E0ED","bias":-50},{"x":550,"y":-80,"bCoef":1,"cMask":["ball","red","blue"],"color":"D5E0ED","strength":0.1,"_length":9,"bias":-50},{"x":550,"y":-240,"bCoef":0,"cMask":["ball"]},{"x":550,"y":-240,"bCoef":0,"cMask":["ball"]},{"x":-550,"y":-240,"bCoef":1,"cMask":["ball"],"color":"D5E0ED"},{"x":550,"y":-240,"bCoef":1,"cMask":["ball"],"color":"D5E0ED"},{"x":-550,"y":-80,"bCoef":0.1,"cMask":[],"color":"a3a3a3","_length":9},{"x":-550,"y":80,"bCoef":0.1,"cMask":[],"color":"a3a3a3","_length":9},{"x":550,"y":-80,"bCoef":0.1,"cMask":["c0"],"color":"272727","strength":0.1,"_length":9},{"x":550,"y":80,"bCoef":0.1,"cMask":["c0"],"color":"272727","strength":0.1,"_length":9},{"x":-325,"y":-238.5,"cMask":["wall"],"cGroup":["wall"],"color":"737573"},{"x":-325,"y":238.5,"cMask":["wall"],"cGroup":["wall"],"color":"737573"},{"x":325,"y":-238.5,"cMask":["wall"],"cGroup":["wall"],"color":"737573"},{"x":325,"y":238.5,"cMask":["wall"],"cGroup":["wall"],"color":"737573"},{"x":325,"y":-70,"cMask":["wall"],"cGroup":["wall"],"curve":-120,"color":"737573"},{"x":325,"y":70,"cMask":["wall"],"cGroup":["wall"],"curve":-120,"color":"737573"},{"x":549,"y":-81,"bCoef":0.1,"cMask":["ball","red","blue"],"cGroup":["wall"],"trait":"goalNet","strength":0.1,"_length":9,"color":"ffffff"},{"x":549,"y":-81,"bCoef":0,"cMask":["ball","red","blue"],"cGroup":["wall"],"trait":"goalNet","damping":0.96,"strength":0.1,"_length":9,"color":"ffffff"},{"x":-36.33260832977,"y":-69.619595273771,"bCoef":0.5,"cMask":["wall"],"trait":"goalPost","color":"737573"},{"x":-73.821461001685,"y":-27.330632717964,"bCoef":0.5,"cMask":["wall"],"trait":"goalPost","color":"737573"},{"x":-46.014361966537,"y":-54.244550695595,"bCoef":0.5,"cMask":["wall"],"trait":"goalPost","color":"737573"},{"x":-59.567788655896,"y":-39.579912744961,"bCoef":0.5,"cMask":["wall"],"trait":"goalPost","color":"737573"},{"x":-27.401905204993,"y":-55.974842894447,"bCoef":0.5,"cMask":["wall"],"trait":"goalPost","color":"737573"},{"x":-49.297436994888,"y":-45.699472272904,"bCoef":0.5,"cMask":["wall"],"trait":"goalPost","color":"737573"},{"x":-51.291668342567,"y":-25.483550876345,"bCoef":0.5,"cMask":["wall"],"trait":"goalPost","color":"737573"},{"x":-63.952037024452,"y":-3.2227163265885,"bCoef":0.5,"cMask":["wall"],"trait":"goalPost","color":"737573"},{"x":-78.895794055559,"y":0.32417480054631,"bCoef":0.5,"cMask":["wall"],"trait":"goalPost","color":"737573"},{"x":-49.967322788025,"y":-4.65870951332,"bCoef":0.5,"cMask":["wall"],"trait":"goalPost","color":"737573"},{"x":-29.751401391465,"y":-2.6644781656408,"bCoef":0.5,"cMask":["wall"],"trait":"goalPost","color":"737573"},{"x":-46.8263783052,"y":12.497432119268,"bCoef":0.5,"cMask":["wall"],"trait":"goalPost","color":"737573"},{"x":-42.579241521635,"y":29.856547074011,"bCoef":0.5,"cMask":["wall"],"trait":"goalPost","color":"737573"},{"x":-59.106141245534,"y":17.104852702161,"bCoef":0.5,"cMask":["wall"],"trait":"goalPost","color":"737573"},{"x":-69.894087183041,"y":32.276923958182,"bCoef":0.5,"cMask":["wall"],"trait":"goalPost","color":"737573"},{"x":-69.356170964318,"y":10.650350277649,"bCoef":0.5,"cMask":["wall"],"trait":"goalPost","color":"737573"},{"x":-26.356801780968,"y":44.267529896973,"bCoef":0.5,"cMask":["wall"],"trait":"goalPost","color":"737573"},{"x":-36.378517274838,"y":52.147864537104,"bCoef":0.5,"cMask":["wall"],"trait":"goalPost","color":"737573"},{"x":-58.005090955371,"y":51.60994831838,"bCoef":0.5,"cMask":["wall"],"trait":"goalPost","color":"737573"},{"x":-32.527166164471,"y":65.4323331171,"bCoef":0.5,"cMask":["wall"],"trait":"goalPost","curve":-24.732085694618,"color":"737573"},{"x":-14.488127495522,"y":76.174616209625,"bCoef":0.5,"cMask":["wall"],"trait":"goalPost","curve":-24.732085694618,"color":"737573"},{"x":-16.928826321916,"y":61.433832500673,"bCoef":0.5,"cMask":["wall"],"trait":"goalPost","color":"737573"},{"x":6.9659557761919,"y":58.957631800408,"bCoef":0.5,"cMask":["wall"],"trait":"goalPost","color":"737573"},{"x":-13.341291310333,"y":51.229465626872,"bCoef":0.5,"cMask":["wall"],"trait":"goalPost","color":"737573"},{"x":-2.7461577238685,"y":30.8765557324,"bCoef":0.5,"cMask":["wall"],"trait":"goalPost","color":"737573"},{"x":28.435218979552,"y":63.4687077328,"bCoef":0.5,"cMask":["wall"],"trait":"goalPost","color":"737573"},{"x":22.589636521506,"y":70.400160549363,"bCoef":0.5,"cMask":["wall"],"trait":"goalPost","color":"737573"},{"x":5.5248205788828,"y":79.275039858045,"bCoef":0.5,"cMask":["wall"],"trait":"goalPost","color":"737573"},{"x":41.344223828575,"y":42.968648295232,"bCoef":0.5,"cMask":["wall"],"trait":"goalPost","curve":0,"color":"737573"},{"x":38.999869652681,"y":61.976890729974,"bCoef":0.5,"cMask":["wall"],"trait":"goalPost","color":"737573"},{"x":56.008861779209,"y":56.522074984591,"bCoef":0.5,"cMask":["wall"],"trait":"goalPost","color":"737573"},{"x":49.919785164602,"y":27.390630394901,"bCoef":0.5,"cMask":["wall"],"trait":"goalPost","curve":0,"color":"737573"},{"x":60.068328222308,"y":34.398228969783,"bCoef":0.5,"cMask":["wall"],"trait":"goalPost","color":"737573"},{"x":63.01646035409,"y":46.373531926884,"bCoef":0.5,"cMask":["wall"],"trait":"goalPost","color":"737573"},{"x":68.928027599344,"y":29.734984570796,"bCoef":0.5,"cMask":["wall"],"trait":"goalPost","color":"737573"},{"x":78.31548222399,"y":9.7321974675032,"bCoef":0.5,"cMask":["wall"],"trait":"goalPost","color":"737573"},{"x":69.65875616911,"y":13.28924956575,"bCoef":0.5,"cMask":["wall"],"trait":"goalPost","color":"737573"},{"x":64.462737561977,"y":-8.245998424817,"bCoef":0.5,"cMask":["wall"],"trait":"goalPost","color":"737573"},{"x":56.780234233423,"y":14.928216074637,"bCoef":0.5,"cMask":["wall"],"trait":"goalPost","color":"737573"},{"x":35.503783381106,"y":15.597978394,"bCoef":0.5,"cMask":["wall"],"trait":"goalPost","color":"737573"},{"x":62.732445363125,"y":-26.858455186361,"bCoef":0.5,"cMask":["wall"],"trait":"goalPost","color":"737573"},{"x":77.00129764056,"y":-17.379674871749,"bCoef":0.5,"cMask":["wall"],"trait":"goalPost","color":"737573"},{"x":63.305863455719,"y":-39.331030477738,"bCoef":0.5,"cMask":["wall"],"trait":"goalPost","color":"737573"},{"x":53.877887996667,"y":-56.497333081438,"bCoef":0.5,"cMask":["wall"],"trait":"goalPost","color":"737573"},{"x":49.590107328654,"y":-48.708324131272,"bCoef":0.5,"cMask":["wall"],"trait":"goalPost","color":"737573"},{"x":28.278154602466,"y":-57.192559877438,"bCoef":0.5,"cMask":["wall"],"trait":"goalPost","color":"737573"},{"x":43.79018771559,"y":-38.909903901781,"bCoef":0.5,"cMask":["wall"],"trait":"goalPost","color":"737573"},{"x":32.154846615592,"y":-28.467061831954,"bCoef":0.5,"cMask":["wall"],"trait":"goalPost","color":"737573"},{"x":51.772009016798,"y":-29.441284558281,"bCoef":0.5,"cMask":["wall"],"trait":"goalPost","color":"737573"},{"x":8.5138426951989,"y":-58.532208313565,"bCoef":0.5,"cMask":["wall"],"trait":"goalPost","color":"737573"},{"x":-3.5832688652041,"y":-42.456918078959,"bCoef":0.5,"cMask":["wall"],"trait":"goalPost","color":"737573"},{"x":-11.656415856378,"y":-57.659472248316,"bCoef":0.5,"cMask":["wall"],"trait":"goalPost","color":"737573"},{"x":-11.240308240956,"y":-66.158887826024,"bCoef":0.5,"cMask":["wall"],"trait":"goalPost","color":"737573"},{"x":-23.849872067281,"y":-75.333208157404,"bCoef":0.5,"cMask":["wall"],"trait":"goalPost","color":"737573"},{"x":0.13623572079257,"y":-72.075474031812,"bCoef":0.5,"cMask":["wall"],"trait":"goalPost","color":"737573"},{"x":27.699717549337,"y":-72.735075803794,"bCoef":0.5,"cMask":["wall"],"trait":"goalPost","color":"737573"},{"x":13.557692835738,"y":-67.325922903394,"bCoef":0.5,"cMask":["wall"],"trait":"goalPost","color":"737573"},{"x":-5.8464583222451,"y":-11.427709842133,"bCoef":0.5,"cMask":["wall"],"trait":"goalPost","color":"737573"},{"x":-3.2586099897905,"y":5.6269451293777,"bCoef":0.5,"cMask":["wall"],"trait":"goalPost","color":"737573"},{"x":11.822135576265,"y":10.680956241028,"bCoef":0.5,"cMask":["wall"],"trait":"goalPost","color":"737573"},{"x":20.849306401585,"y":-4.242478847855,"bCoef":0.5,"cMask":["wall"],"trait":"goalPost","color":"737573"},{"x":11.015384298074,"y":-19.196396850074,"bCoef":0.5,"cMask":["wall"],"trait":"goalPost","color":"737573"},{"x":0,"y":239,"cMask":["red","blue"],"cGroup":["redKO","blueKO"],"trait":"kickOffBarrier","color":"737573","vis":false},{"x":0,"y":80,"bCoef":0.1,"cMask":["red","blue"],"cGroup":["redKO","blueKO"],"trait":"kickOffBarrier","color":"737573"},{"x":0,"y":-80,"bCoef":0.1,"cMask":["red","blue"],"cGroup":["redKO","blueKO"],"trait":"kickOffBarrier","color":"737573"},{"x":0,"y":-239,"cMask":["red","blue"],"cGroup":["redKO","blueKO"],"trait":"kickOffBarrier","color":"737573","vis":false},{"x":0,"y":270,"cMask":["red","blue"],"cGroup":["redKO","blueKO"],"vis":false},{"x":0,"y":-270,"cMask":["red","blue"],"cGroup":["redKO","blueKO"],"vis":false},{"x":-551,"y":-84,"trait":"goalNet","curve":0,"color":"C0CAD6"},{"x":551,"y":-79,"trait":"goalNet","curve":0,"color":"C0CAD6"},{"x":551,"y":81,"trait":"goalNet","curve":0,"color":"C0CAD6"},{"x":-550,"y":82,"bCoef":0.1,"cMask":["red","blue"],"cGroup":["redKO","blueKO"],"trait":"kickOffBarrier","color":"C0CAD6"},{"x":550,"y":-79,"bCoef":0.1,"cMask":["red","blue"],"cGroup":["redKO","blueKO"],"trait":"kickOffBarrier","color":"C0CAD6"},{"x":550,"y":81,"bCoef":0.1,"cMask":["red","blue"],"cGroup":["redKO","blueKO"],"trait":"kickOffBarrier","color":"C0CAD6"},{"x":551,"y":81,"bCoef":1,"cMask":["ball"],"trait":"ballArea","curve":0,"vis":false,"color":"C0CAD6"},{"x":-551,"y":-80,"bCoef":0.1,"cMask":["c0"],"cGroup":["c0"],"trait":"kickOffBarrier","color":"737573"},{"x":-550,"y":82,"bCoef":0.1,"cMask":["c0"],"cGroup":["c0"],"trait":"kickOffBarrier","color":"737573"},{"x":550,"y":-79,"bCoef":0.1,"cMask":["c0"],"cGroup":["c0"],"trait":"kickOffBarrier","color":"737573","curve":0},{"x":550,"y":81,"bCoef":0.1,"cMask":["c0"],"cGroup":["c0"],"trait":"kickOffBarrier","color":"737573","curve":0},{"x":-551,"y":78,"trait":"ballArea","curve":0,"color":"C0CAD6"},{"x":-551,"y":-80.5,"cMask":["c0"],"cGroup":["ball","c1"],"trait":"ballArea","curve":0,"color":"C0CAD6"},{"x":550,"y":79,"cMask":["c0"],"cGroup":["ball","c1"],"trait":"ballArea","curve":0,"color":"C0CAD6"},{"x":550,"y":-79,"cMask":["c0"],"cGroup":["ball","c1"],"trait":"ballArea","curve":0,"color":"C0CAD6"},{"x":-550,"y":76,"cMask":["c0"],"cGroup":["ball","c1"],"trait":"ciary","color":"C0CAD6"},{"x":-550,"y":-78,"cMask":["c0"],"cGroup":["ball","c1"],"trait":"ciary","curve":0,"color":"C0CAD6"},{"x":550,"y":77,"cMask":["c0"],"cGroup":["ball","c1"],"trait":"ciary","color":"C0CAD6"},{"x":550,"y":-77,"cMask":["c0"],"cGroup":["ball","c1"],"trait":"ciary","color":"C0CAD6"},{"x":-551,"y":-82,"trait":"goalNet","curve":0,"color":"C0CAD6"},{"x":551,"y":-79,"trait":"goalNet","curve":0,"color":"C0CAD6"},{"x":551,"y":81,"trait":"goalNet","curve":0,"color":"C0CAD6"},{"x":-550,"y":84,"bCoef":0.1,"cMask":["red","blue"],"cGroup":["redKO","blueKO"],"trait":"kickOffBarrier","color":"C0CAD6"},{"x":550,"y":-79,"bCoef":0.1,"cMask":["red","blue"],"cGroup":["redKO","blueKO"],"trait":"kickOffBarrier","color":"C0CAD6"},{"x":550,"y":81,"bCoef":0.1,"cMask":["red","blue"],"cGroup":["redKO","blueKO"],"trait":"kickOffBarrier","color":"C0CAD6"},{"x":551,"y":81,"bCoef":1,"cMask":["ball"],"trait":"ballArea","curve":0,"vis":false,"color":"C0CAD6"},{"x":-551,"y":-78,"bCoef":0.1,"cMask":["c0"],"cGroup":["c0"],"trait":"kickOffBarrier","color":"C0CAD6"},{"x":-550,"y":84,"bCoef":0.1,"cMask":["c0"],"cGroup":["c0"],"trait":"kickOffBarrier","color":"C0CAD6"},{"x":550,"y":-79,"bCoef":0.1,"cMask":["c0"],"cGroup":["c0"],"trait":"kickOffBarrier","color":"C0CAD6","curve":0},{"x":550,"y":81,"bCoef":0.1,"cMask":["c0"],"cGroup":["c0"],"trait":"kickOffBarrier","color":"C0CAD6","curve":0},{"x":-551,"y":80,"trait":"ballArea","curve":0,"color":"C0CAD6"},{"x":-551,"y":-78.5,"cMask":["c0"],"cGroup":["ball","c1"],"trait":"ballArea","curve":0,"color":"C0CAD6"},{"x":550,"y":79,"cMask":["c0"],"cGroup":["ball","c1"],"trait":"ballArea","curve":0,"color":"C0CAD6"},{"x":550,"y":-79,"cMask":["c0"],"cGroup":["ball","c1"],"trait":"ballArea","curve":0,"color":"C0CAD6"},{"x":-592,"y":76,"cMask":["c0"],"cGroup":["ball","c1"],"trait":"ballArea","curve":0,"color":"C0CAD6"},{"x":-592,"y":-74,"cMask":["c0"],"cGroup":["ball","c1"],"trait":"ballArea","curve":0,"color":"C0CAD6"},{"x":592,"y":75,"cMask":["c0"],"cGroup":["ball","c1"],"trait":"ballArea","curve":0,"color":"C0CAD6"},{"x":592,"y":-75,"cMask":["c0"],"cGroup":["ball","c1"],"trait":"ballArea","curve":0,"color":"C0CAD6"},{"x":-557,"y":79,"cMask":["c0"],"cGroup":["ball","c1"],"trait":"ciary","color":"C0CAD6"},{"x":-557,"y":-77,"cMask":["c0"],"cGroup":["ball","c1"],"trait":"ciary","color":"C0CAD6"},{"x":-564,"y":78,"cMask":["c0"],"cGroup":["ball","c1"],"trait":"ciary","color":"C0CAD6"},{"x":-564,"y":-76,"cMask":["c0"],"cGroup":["ball","c1"],"trait":"ciary","color":"C0CAD6"},{"x":-571,"y":77,"cMask":["c0"],"cGroup":["ball","c1"],"trait":"ciary","color":"C0CAD6"},{"x":-571,"y":-75,"cMask":["c0"],"cGroup":["ball","c1"],"trait":"ciary","color":"C0CAD6"},{"x":-578,"y":76,"cMask":["c0"],"cGroup":["ball","c1"],"trait":"ciary","color":"C0CAD6"},{"x":-578,"y":-74,"cMask":["c0"],"cGroup":["ball","c1"],"trait":"ciary","color":"C0CAD6"},{"x":-585,"y":75,"cMask":["c0"],"cGroup":["ball","c1"],"trait":"ciary","color":"C0CAD6"},{"x":-585,"y":-73,"cMask":["c0"],"cGroup":["ball","c1"],"trait":"ciary","color":"C0CAD6"},{"x":-550,"y":1,"cMask":["c0"],"cGroup":["ball","c1"],"trait":"ciary","color":"C0CAD6"},{"x":-591,"y":1,"cMask":["c0"],"cGroup":["ball","c1"],"trait":"ciary","color":"C0CAD6"},{"x":-550,"y":8,"cMask":["c0"],"cGroup":["ball","c1"],"trait":"ciary","color":"C0CAD6"},{"x":-591,"y":8,"cMask":["c0"],"cGroup":["ball","c1"],"trait":"ciary","color":"C0CAD6"},{"x":-550,"y":15,"cMask":["c0"],"cGroup":["ball","c1"],"trait":"ciary","color":"C0CAD6","curve":0},{"x":-591,"y":15,"cMask":["c0"],"cGroup":["ball","c1"],"trait":"ciary","color":"C0CAD6","curve":0},{"x":-550,"y":22,"cMask":["c0"],"cGroup":["ball","c1"],"trait":"ciary","color":"C0CAD6"},{"x":-591,"y":22,"cMask":["c0"],"cGroup":["ball","c1"],"trait":"ciary","color":"C0CAD6"},{"x":-550,"y":29,"cMask":["c0"],"cGroup":["ball","c1"],"trait":"ciary","color":"C0CAD6"},{"x":-591,"y":29,"cMask":["c0"],"cGroup":["ball","c1"],"trait":"ciary","color":"C0CAD6"},{"x":-550,"y":36,"cMask":["c0"],"cGroup":["ball","c1"],"trait":"ciary","color":"C0CAD6"},{"x":-591,"y":36,"cMask":["c0"],"cGroup":["ball","c1"],"trait":"ciary","color":"C0CAD6"},{"x":-550,"y":43,"cMask":["c0"],"cGroup":["ball","c1"],"trait":"ciary","color":"C0CAD6"},{"x":-591,"y":43,"cMask":["c0"],"cGroup":["ball","c1"],"trait":"ciary","color":"C0CAD6"},{"x":-550,"y":50,"cMask":["c0"],"cGroup":["ball","c1"],"trait":"ciary","color":"C0CAD6"},{"x":-591,"y":50,"cMask":["c0"],"cGroup":["ball","c1"],"trait":"ciary","color":"C0CAD6"},{"x":-550,"y":57,"cMask":["c0"],"cGroup":["ball","c1"],"trait":"ciary","color":"C0CAD6"},{"x":-591,"y":57,"cMask":["c0"],"cGroup":["ball","c1"],"trait":"ciary","color":"C0CAD6"},{"x":-550,"y":64,"cMask":["c0"],"cGroup":["ball","c1"],"trait":"ciary","color":"C0CAD6"},{"x":-591,"y":64,"cMask":["c0"],"cGroup":["ball","c1"],"trait":"ciary","color":"C0CAD6"},{"x":-550,"y":71,"cMask":["c0"],"cGroup":["ball","c1"],"trait":"ciary","color":"C0CAD6"},{"x":-591,"y":71,"cMask":["c0"],"cGroup":["ball","c1"],"trait":"ciary","color":"C0CAD6"},{"x":-550,"y":78,"cMask":["c0"],"cGroup":["ball","c1"],"trait":"ciary","color":"C0CAD6"},{"x":-575,"y":78,"cMask":["c0"],"cGroup":["ball","c1"],"trait":"ciary","color":"C0CAD6"},{"x":-550,"y":-6,"cMask":["c0"],"cGroup":["ball","c1"],"trait":"ciary","color":"C0CAD6"},{"x":-591,"y":-6,"cMask":["c0"],"cGroup":["ball","c1"],"trait":"ciary","color":"C0CAD6"},{"x":-550,"y":-13,"cMask":["c0"],"cGroup":["ball","c1"],"trait":"ciary","color":"C0CAD6"},{"x":-591,"y":-13,"cMask":["c0"],"cGroup":["ball","c1"],"trait":"ciary","color":"C0CAD6"},{"x":-550,"y":-20,"cMask":["c0"],"cGroup":["ball","c1"],"trait":"ciary","color":"C0CAD6"},{"x":-591,"y":-20,"cMask":["c0"],"cGroup":["ball","c1"],"trait":"ciary","color":"C0CAD6"},{"x":-550,"y":-27,"cMask":["c0"],"cGroup":["ball","c1"],"trait":"ciary","color":"C0CAD6"},{"x":-591,"y":-27,"cMask":["c0"],"cGroup":["ball","c1"],"trait":"ciary","color":"C0CAD6"},{"x":-550,"y":-34,"cMask":["c0"],"cGroup":["ball","c1"],"trait":"ciary","color":"C0CAD6"},{"x":-591,"y":-34,"cMask":["c0"],"cGroup":["ball","c1"],"trait":"ciary","color":"C0CAD6"},{"x":-550,"y":-41,"cMask":["c0"],"cGroup":["ball","c1"],"trait":"ciary","color":"C0CAD6"},{"x":-591,"y":-41,"cMask":["c0"],"cGroup":["ball","c1"],"trait":"ciary","color":"C0CAD6"},{"x":-550,"y":-48,"cMask":["c0"],"cGroup":["ball","c1"],"trait":"ciary","color":"C0CAD6"},{"x":-591,"y":-48,"cMask":["c0"],"cGroup":["ball","c1"],"trait":"ciary","color":"C0CAD6"},{"x":-550,"y":-55,"cMask":["c0"],"cGroup":["ball","c1"],"trait":"ciary","color":"C0CAD6"},{"x":-591,"y":-55,"cMask":["c0"],"cGroup":["ball","c1"],"trait":"ciary","color":"C0CAD6"},{"x":-550,"y":-62,"cMask":["c0"],"cGroup":["ball","c1"],"trait":"ciary","color":"C0CAD6"},{"x":-591,"y":-62,"cMask":["c0"],"cGroup":["ball","c1"],"trait":"ciary","color":"C0CAD6"},{"x":-550,"y":-69,"cMask":["c0"],"cGroup":["ball","c1"],"trait":"ciary","color":"C0CAD6"},{"x":-591,"y":-69,"cMask":["c0"],"cGroup":["ball","c1"],"trait":"ciary","color":"C0CAD6"},{"x":-550,"y":-76,"cMask":["c0"],"cGroup":["ball","c1"],"trait":"ciary","curve":0,"color":"C0CAD6"},{"x":-575,"y":-76,"cMask":["c0"],"cGroup":["ball","c1"],"trait":"ciary","curve":0,"color":"C0CAD6"},{"x":557,"y":78,"cMask":["c0"],"cGroup":["ball","c1"],"trait":"ciary","curve":0,"color":"C0CAD6"},{"x":557,"y":-78,"cMask":["c0"],"cGroup":["ball","c1"],"trait":"ciary","color":"C0CAD6"},{"x":564,"y":77,"cMask":["c0"],"cGroup":["ball","c1"],"trait":"ciary","curve":0,"color":"C0CAD6"},{"x":564,"y":-77,"cMask":["c0"],"cGroup":["ball","c1"],"trait":"ciary","color":"C0CAD6"},{"x":571,"y":76,"cMask":["c0"],"cGroup":["ball","c1"],"trait":"ciary","curve":0,"color":"C0CAD6"},{"x":571,"y":-76,"cMask":["c0"],"cGroup":["ball","c1"],"trait":"ciary","color":"C0CAD6"},{"x":578,"y":75,"cMask":["c0"],"cGroup":["ball","c1"],"trait":"ciary","curve":0,"color":"C0CAD6"},{"x":578,"y":-75,"cMask":["c0"],"cGroup":["ball","c1"],"trait":"ciary","color":"C0CAD6"},{"x":585,"y":74,"cMask":["c0"],"cGroup":["ball","c1"],"trait":"ciary","curve":0,"color":"C0CAD6"},{"x":585,"y":-74,"cMask":["c0"],"cGroup":["ball","c1"],"trait":"ciary","color":"C0CAD6"},{"x":550,"y":0,"cMask":["c0"],"cGroup":["ball","c1"],"trait":"ciary","color":"C0CAD6"},{"x":591,"y":0,"cMask":["c0"],"cGroup":["ball","c1"],"trait":"ciary","color":"C0CAD6"},{"x":550,"y":7,"cMask":["c0"],"cGroup":["ball","c1"],"trait":"ciary","color":"C0CAD6"},{"x":591,"y":7,"cMask":["c0"],"cGroup":["ball","c1"],"trait":"ciary","color":"C0CAD6"},{"x":550,"y":14,"cMask":["c0"],"cGroup":["ball","c1"],"trait":"ciary","color":"C0CAD6"},{"x":591,"y":14,"cMask":["c0"],"cGroup":["ball","c1"],"trait":"ciary","color":"C0CAD6"},{"x":550,"y":21,"cMask":["c0"],"cGroup":["ball","c1"],"trait":"ciary","color":"C0CAD6","curve":0},{"x":591,"y":21,"cMask":["c0"],"cGroup":["ball","c1"],"trait":"ciary","color":"C0CAD6","curve":0},{"x":550,"y":28,"cMask":["c0"],"cGroup":["ball","c1"],"trait":"ciary","color":"C0CAD6"},{"x":591,"y":28,"cMask":["c0"],"cGroup":["ball","c1"],"trait":"ciary","color":"C0CAD6"},{"x":550,"y":35,"cMask":["c0"],"cGroup":["ball","c1"],"trait":"ciary","color":"C0CAD6"},{"x":591,"y":35,"cMask":["c0"],"cGroup":["ball","c1"],"trait":"ciary","color":"C0CAD6"},{"x":550,"y":42,"cMask":["c0"],"cGroup":["ball","c1"],"trait":"ciary","curve":0,"color":"C0CAD6"},{"x":591,"y":42,"cMask":["c0"],"cGroup":["ball","c1"],"trait":"ciary","color":"C0CAD6"},{"x":550,"y":49,"cMask":["c0"],"cGroup":["ball","c1"],"trait":"ciary","curve":0,"color":"C0CAD6"},{"x":591,"y":49,"cMask":["c0"],"cGroup":["ball","c1"],"trait":"ciary","color":"C0CAD6"},{"x":550,"y":56,"cMask":["c0"],"cGroup":["ball","c1"],"trait":"ciary","curve":0,"color":"C0CAD6"},{"x":591,"y":56,"cMask":["c0"],"cGroup":["ball","c1"],"trait":"ciary","color":"C0CAD6"},{"x":550,"y":63,"cMask":["c0"],"cGroup":["ball","c1"],"trait":"ciary","curve":0,"color":"C0CAD6"},{"x":591,"y":63,"cMask":["c0"],"cGroup":["ball","c1"],"trait":"ciary","color":"C0CAD6"},{"x":550,"y":70,"cMask":["c0"],"cGroup":["ball","c1"],"trait":"ciary","curve":0,"color":"C0CAD6"},{"x":591,"y":70,"cMask":["c0"],"cGroup":["ball","c1"],"trait":"ciary","color":"C0CAD6"},{"x":550,"y":77,"cMask":["c0"],"cGroup":["ball","c1"],"trait":"ciary","curve":0,"color":"C0CAD6"},{"x":575,"y":77,"cMask":["c0"],"cGroup":["ball","c1"],"trait":"ciary","curve":0,"color":"C0CAD6"},{"x":550,"y":-7,"cMask":["c0"],"cGroup":["ball","c1"],"trait":"ciary","color":"C0CAD6"},{"x":591,"y":-7,"cMask":["c0"],"cGroup":["ball","c1"],"trait":"ciary","color":"C0CAD6"},{"x":550,"y":-14,"cMask":["c0"],"cGroup":["ball","c1"],"trait":"ciary","color":"C0CAD6"},{"x":591,"y":-14,"cMask":["c0"],"cGroup":["ball","c1"],"trait":"ciary","color":"C0CAD6"},{"x":550,"y":-21,"cMask":["c0"],"cGroup":["ball","c1"],"trait":"ciary","color":"C0CAD6"},{"x":591,"y":-21,"cMask":["c0"],"cGroup":["ball","c1"],"trait":"ciary","color":"C0CAD6"},{"x":550,"y":-28,"cMask":["c0"],"cGroup":["ball","c1"],"trait":"ciary","color":"C0CAD6"},{"x":591,"y":-28,"cMask":["c0"],"cGroup":["ball","c1"],"trait":"ciary","color":"C0CAD6"},{"x":550,"y":-35,"cMask":["c0"],"cGroup":["ball","c1"],"trait":"ciary","color":"C0CAD6"},{"x":591,"y":-35,"cMask":["c0"],"cGroup":["ball","c1"],"trait":"ciary","color":"C0CAD6"},{"x":550,"y":-42,"cMask":["c0"],"cGroup":["ball","c1"],"trait":"ciary","color":"C0CAD6"},{"x":591,"y":-42,"cMask":["c0"],"cGroup":["ball","c1"],"trait":"ciary","color":"C0CAD6"},{"x":550,"y":-49,"cMask":["c0"],"cGroup":["ball","c1"],"trait":"ciary","color":"C0CAD6"},{"x":591,"y":-49,"cMask":["c0"],"cGroup":["ball","c1"],"trait":"ciary","color":"C0CAD6"},{"x":550,"y":-56,"cMask":["c0"],"cGroup":["ball","c1"],"trait":"ciary","color":"C0CAD6"},{"x":591,"y":-56,"cMask":["c0"],"cGroup":["ball","c1"],"trait":"ciary","color":"C0CAD6"},{"x":550,"y":-63,"cMask":["c0"],"cGroup":["ball","c1"],"trait":"ciary","color":"C0CAD6"},{"x":591,"y":-63,"cMask":["c0"],"cGroup":["ball","c1"],"trait":"ciary","color":"C0CAD6"},{"x":550,"y":-70,"cMask":["c0"],"cGroup":["ball","c1"],"trait":"ciary","color":"C0CAD6"},{"x":591,"y":-70,"cMask":["c0"],"cGroup":["ball","c1"],"trait":"ciary","color":"C0CAD6"},{"x":550,"y":-77,"cMask":["c0"],"cGroup":["ball","c1"],"trait":"ciary","color":"C0CAD6"},{"x":575,"y":-76,"cMask":["c0"],"cGroup":["ball","c1"],"trait":"ciary","color":"C0CAD6"},{"x":-325,"y":-70,"cMask":["wall"],"cGroup":["wall"],"curve":120,"color":"737573"},{"x":-325,"y":70,"cMask":["wall"],"cGroup":["wall"],"curve":120,"color":"737573"}],"segments":[{"v0":6,"v1":7,"color":"D5E0ED","bCoef":1,"cMask":["ball"],"bias":50},{"v0":8,"v1":9,"color":"D5E0ED","bCoef":1,"cMask":["ball"],"bias":-50},{"v0":10,"v1":11,"color":"D5E0ED","bCoef":1,"cMask":["ball"]},{"v0":12,"v1":13,"color":"D5E0ED","bCoef":1,"cMask":["ball"],"bias":-50},{"v0":14,"v1":15,"color":"D5E0ED","bCoef":1,"cMask":["ball"],"bias":-50},{"v0":16,"v1":17,"color":"F8F8F8","bCoef":0,"cMask":["ball"]},{"v0":18,"v1":19,"color":"D5E0ED","bCoef":1,"cMask":["ball"]},{"v0":20,"v1":21,"color":"a3a3a3","bCoef":0.1,"cMask":[]},{"v0":22,"v1":23,"color":"272727","bCoef":0.1,"cMask":["c0"],"strength":0.1,"_length":9},{"v0":24,"v1":25,"color":"737573","cMask":["wall"],"cGroup":["wall"],"x":-325},{"v0":26,"v1":27,"color":"737573","cMask":["wall"],"cGroup":["wall"],"x":325},{"v0":28,"v1":29,"curve":-120,"color":"737573","cMask":["wall"],"cGroup":["wall"],"x":325},{"v0":30,"v1":31,"curve":0,"vis":false,"color":"ffffff","bCoef":0.1,"cMask":["ball","red","blue"],"cGroup":["wall"],"trait":"goalNet","y":-81,"x":549,"strength":0.1,"_length":9},{"v0":32,"v1":33,"curve":-41.972087823846,"color":"737573","bCoef":0.5,"cMask":["wall"],"trait":"goalPost"},{"v0":32,"v1":34,"curve":-41.972087823846,"color":"737573","bCoef":0.5,"cMask":["wall"],"trait":"goalPost"},{"v0":33,"v1":35,"curve":39.307648116107,"color":"737573","bCoef":0.5,"cMask":["wall"],"trait":"goalPost"},{"v0":34,"v1":36,"curve":39.307648116107,"color":"737573","bCoef":0.5,"cMask":["wall"],"trait":"goalPost"},{"v0":36,"v1":37,"curve":-7.6706381942666,"color":"737573","bCoef":0.5,"cMask":["wall"],"trait":"goalPost"},{"v0":37,"v1":38,"curve":-7.6706381942666,"color":"737573","bCoef":0.5,"cMask":["wall"],"trait":"goalPost"},{"v0":38,"v1":35,"curve":-25.58879878153,"color":"737573","bCoef":0.5,"cMask":["wall"],"trait":"goalPost"},{"v0":38,"v1":39,"curve":-22.118592734133,"color":"737573","bCoef":0.5,"cMask":["wall"],"trait":"goalPost"},{"v0":39,"v1":40,"curve":-29.626928237609,"color":"737573","bCoef":0.5,"cMask":["wall"],"trait":"goalPost"},{"v0":38,"v1":41,"curve":-8.7974107099911,"color":"737573","bCoef":0.5,"cMask":["wall"],"trait":"goalPost"},{"v0":41,"v1":42,"curve":0,"color":"737573","bCoef":0.5,"cMask":["wall"],"trait":"goalPost"},{"v0":42,"v1":43,"curve":0,"color":"737573","bCoef":0.5,"cMask":["wall"],"trait":"goalPost"},{"v0":43,"v1":44,"curve":-23.690782919169,"color":"737573","bCoef":0.5,"cMask":["wall"],"trait":"goalPost"},{"v0":44,"v1":45,"curve":6.3596602397285,"color":"737573","bCoef":0.5,"cMask":["wall"],"trait":"goalPost"},{"v0":45,"v1":46,"curve":-9.7585475660135,"color":"737573","bCoef":0.5,"cMask":["wall"],"trait":"goalPost"},{"v0":46,"v1":47,"curve":26.464535213028,"color":"737573","bCoef":0.5,"cMask":["wall"],"trait":"goalPost"},{"v0":40,"v1":47,"curve":-18.492225491127,"color":"737573","bCoef":0.5,"cMask":["wall"],"trait":"goalPost"},{"v0":44,"v1":48,"curve":-21.380476552998,"color":"737573","bCoef":0.5,"cMask":["wall"],"trait":"goalPost"},{"v0":44,"v1":49,"curve":-7.5955767419349,"color":"737573","bCoef":0.5,"cMask":["wall"],"trait":"goalPost"},{"v0":49,"v1":50,"curve":32.559346404261,"color":"737573","bCoef":0.5,"cMask":["wall"],"trait":"goalPost"},{"v0":50,"v1":51,"curve":-24.830195108546,"color":"737573","bCoef":0.5,"cMask":["wall"],"trait":"goalPost"},{"v0":51,"v1":52,"curve":-24.732085694618,"color":"737573","bCoef":0.5,"cMask":["wall"],"trait":"goalPost"},{"v0":52,"v1":53,"curve":27.41392200816,"color":"737573","bCoef":0.5,"cMask":["wall"],"trait":"goalPost"},{"v0":53,"v1":54,"color":"737573","bCoef":0.5,"cMask":["wall"],"trait":"goalPost"},{"v0":54,"v1":55,"curve":3.8183048659928,"color":"737573","bCoef":0.5,"cMask":["wall"],"trait":"goalPost"},{"v0":55,"v1":56,"curve":21.545295296019,"color":"737573","bCoef":0.5,"cMask":["wall"],"trait":"goalPost"},{"v0":56,"v1":48,"curve":4.0746613936398,"color":"737573","bCoef":0.5,"cMask":["wall"],"trait":"goalPost"},{"v0":54,"v1":57,"curve":-22.61986494804,"color":"737573","bCoef":0.5,"cMask":["wall"],"trait":"goalPost"},{"v0":54,"v1":58,"curve":-38.02475667701,"color":"737573","bCoef":0.5,"cMask":["wall"],"trait":"goalPost"},{"v0":58,"v1":59,"curve":17.640759104042,"color":"737573","bCoef":0.5,"cMask":["wall"],"trait":"goalPost"},{"v0":57,"v1":60,"curve":-19.050603759689,"color":"737573","bCoef":0.5,"cMask":["wall"],"trait":"goalPost"},{"v0":60,"v1":61,"curve":25.573402898373,"color":"737573","bCoef":0.5,"cMask":["wall"],"trait":"goalPost"},{"v0":61,"v1":62,"curve":-26.199686164533,"color":"737573","bCoef":0.5,"cMask":["wall"],"trait":"goalPost"},{"v0":60,"v1":63,"curve":-4.7900110337447,"color":"737573","bCoef":0.5,"cMask":["wall"],"trait":"goalPost"},{"v0":60,"v1":64,"curve":-12.808705815,"color":"737573","bCoef":0.5,"cMask":["wall"],"trait":"goalPost"},{"v0":64,"v1":65,"curve":0,"color":"737573","bCoef":0.5,"cMask":["wall"],"trait":"goalPost"},{"v0":65,"v1":66,"curve":-19.564814063615,"color":"737573","bCoef":0.5,"cMask":["wall"],"trait":"goalPost"},{"v0":66,"v1":67,"curve":-23.127465433213,"color":"737573","bCoef":0.5,"cMask":["wall"],"trait":"goalPost"},{"v0":67,"v1":68,"curve":47.924977949156,"color":"737573","bCoef":0.5,"cMask":["wall"],"trait":"goalPost"},{"v0":68,"v1":69,"curve":-25.654246845845,"color":"737573","bCoef":0.5,"cMask":["wall"],"trait":"goalPost"},{"v0":69,"v1":70,"curve":0,"color":"737573","bCoef":0.5,"cMask":["wall"],"trait":"goalPost"},{"v0":70,"v1":71,"curve":20.078509574305,"color":"737573","bCoef":0.5,"cMask":["wall"],"trait":"goalPost"},{"v0":71,"v1":63,"curve":0,"color":"737573","bCoef":0.5,"cMask":["wall"],"trait":"goalPost"},{"v0":69,"v1":72,"curve":-15.453235238194,"color":"737573","bCoef":0.5,"cMask":["wall"],"trait":"goalPost"},{"v0":72,"v1":73,"curve":0,"color":"737573","bCoef":0.5,"cMask":["wall"],"trait":"goalPost"},{"v0":73,"v1":74,"curve":-25.787488089764,"color":"737573","bCoef":0.5,"cMask":["wall"],"trait":"goalPost"},{"v0":74,"v1":75,"curve":-29.104815395383,"color":"737573","bCoef":0.5,"cMask":["wall"],"trait":"goalPost"},{"v0":75,"v1":76,"curve":16.260204708312,"color":"737573","bCoef":0.5,"cMask":["wall"],"trait":"goalPost"},{"v0":76,"v1":77,"curve":-31.369727296019,"color":"737573","bCoef":0.5,"cMask":["wall"],"trait":"goalPost"},{"v0":77,"v1":78,"curve":16.260204708312,"color":"737573","bCoef":0.5,"cMask":["wall"],"trait":"goalPost"},{"v0":78,"v1":79,"curve":-5.4526219878125,"color":"737573","bCoef":0.5,"cMask":["wall"],"trait":"goalPost"},{"v0":79,"v1":80,"curve":-10.38885781547,"color":"737573","bCoef":0.5,"cMask":["wall"],"trait":"goalPost"},{"v0":80,"v1":69,"curve":13.958142285095,"color":"737573","bCoef":0.5,"cMask":["wall"],"trait":"goalPost"},{"v0":77,"v1":81,"curve":-3.3943123792006,"color":"737573","bCoef":0.5,"cMask":["wall"],"trait":"goalPost"},{"v0":81,"v1":82,"curve":-24.781713321362,"color":"737573","bCoef":0.5,"cMask":["wall"],"trait":"goalPost"},{"v0":82,"v1":83,"curve":23.251797286617,"color":"737573","bCoef":0.5,"cMask":["wall"],"trait":"goalPost"},{"v0":83,"v1":36,"curve":0,"color":"737573","bCoef":0.5,"cMask":["wall"],"trait":"goalPost"},{"v0":36,"v1":84,"curve":34.432147175581,"color":"737573","bCoef":0.5,"cMask":["wall"],"trait":"goalPost"},{"v0":84,"v1":85,"curve":-25.63473646559,"color":"737573","bCoef":0.5,"cMask":["wall"],"trait":"goalPost"},{"v0":85,"v1":86,"curve":11.055080303312,"color":"737573","bCoef":0.5,"cMask":["wall"],"trait":"goalPost"},{"v0":86,"v1":87,"curve":33.290076429352,"color":"737573","bCoef":0.5,"cMask":["wall"],"trait":"goalPost"},{"v0":87,"v1":88,"curve":0,"color":"737573","bCoef":0.5,"cMask":["wall"],"trait":"goalPost"},{"v0":88,"v1":77,"curve":13.163889310356,"color":"737573","bCoef":0.5,"cMask":["wall"],"trait":"goalPost"},{"v0":82,"v1":89,"curve":-5.9896134344567,"color":"737573","bCoef":0.5,"cMask":["wall"],"trait":"goalPost"},{"v0":89,"v1":42,"curve":-10.52479079919,"color":"737573","bCoef":0.5,"cMask":["wall"],"trait":"goalPost"},{"v0":42,"v1":90,"curve":-12.68038349182,"color":"737573","bCoef":0.5,"cMask":["wall"],"trait":"goalPost"},{"v0":90,"v1":56,"curve":-20.383003700055,"color":"737573","bCoef":0.5,"cMask":["wall"],"trait":"goalPost"},{"v0":56,"v1":91,"curve":19.642197209326,"color":"737573","bCoef":0.5,"cMask":["wall"],"trait":"goalPost"},{"v0":91,"v1":71,"curve":-2.7409020355992,"color":"737573","bCoef":0.5,"cMask":["wall"],"trait":"goalPost"},{"v0":71,"v1":92,"curve":0.15913530748199,"color":"737573","bCoef":0.5,"cMask":["wall"],"trait":"goalPost"},{"v0":92,"v1":79,"curve":0,"color":"737573","bCoef":0.5,"cMask":["wall"],"trait":"goalPost"},{"v0":79,"v1":93,"curve":-8.8161746788795,"color":"737573","bCoef":0.5,"cMask":["wall"],"trait":"goalPost"},{"v0":93,"v1":82,"curve":19.352654077974,"color":"737573","bCoef":0.5,"cMask":["wall"],"trait":"goalPost"},{"v0":62,"v1":59,"curve":35.810257640434,"color":"737573","bCoef":0.5,"cMask":["wall"],"trait":"goalPost"},{"v0":94,"v1":95,"color":"737573","cMask":["red","blue"],"cGroup":["redKO","blueKO"],"trait":"kickOffBarrier"},{"v0":95,"v1":96,"curve":180,"color":"737573","bCoef":0.1,"cMask":["red","blue"],"cGroup":["blueKO"],"trait":"kickOffBarrier"},{"v0":95,"v1":96,"curve":-180,"color":"737573","bCoef":0.1,"cMask":["red","blue"],"cGroup":["redKO"],"trait":"kickOffBarrier"},{"v0":96,"v1":97,"color":"737573","cMask":["red","blue"],"cGroup":["redKO","blueKO"],"trait":"kickOffBarrier"},{"v0":94,"v1":98,"vis":false,"color":"272727","cMask":["red","blue"],"cGroup":["redKO","blueKO"]},{"v0":99,"v1":97,"vis":false,"color":"272727","cMask":["red","blue"],"cGroup":["redKO","blueKO"],"x":0},{"v0":107,"v1":108,"vis":true,"color":"737573","bCoef":0.1,"cMask":["c0"],"cGroup":["c0"],"trait":"kickOffBarrier"},{"v0":109,"v1":110,"curve":0,"vis":true,"color":"737573","bCoef":0.1,"cMask":["c0"],"cGroup":["c0"],"trait":"kickOffBarrier"},{"v0":126,"v1":127,"vis":true,"color":"C0CAD6","bCoef":0.1,"cMask":["c0"],"cGroup":["c0"],"trait":"kickOffBarrier"},{"v0":128,"v1":129,"curve":0,"vis":true,"color":"C0CAD6","bCoef":0.1,"cMask":["c0"],"cGroup":["c0"],"trait":"kickOffBarrier"},{"v0":130,"v1":134,"curve":0,"color":"C0CAD6","trait":"goalNet"},{"v0":131,"v1":135,"curve":0,"color":"C0CAD6","trait":"goalNet"},{"v0":134,"v1":135,"curve":0,"color":"C0CAD6","trait":"goalNet"},{"v0":132,"v1":136,"curve":0,"color":"C0CAD6","trait":"goalNet"},{"v0":133,"v1":137,"curve":0,"color":"C0CAD6","trait":"goalNet"},{"v0":136,"v1":137,"curve":0,"color":"C0CAD6","trait":"goalNet"},{"v0":138,"v1":139,"color":"C0CAD6","cMask":["c0"],"cGroup":["ball","c1"],"trait":"ciary"},{"v0":140,"v1":141,"color":"C0CAD6","cMask":["c0"],"cGroup":["ball","c1"],"trait":"ciary"},{"v0":142,"v1":143,"color":"C0CAD6","cMask":["c0"],"cGroup":["ball","c1"],"trait":"ciary"},{"v0":144,"v1":145,"color":"C0CAD6","cMask":["c0"],"cGroup":["ball","c1"],"trait":"ciary"},{"v0":146,"v1":147,"color":"C0CAD6","cMask":["c0"],"cGroup":["ball","c1"],"trait":"ciary"},{"v0":148,"v1":149,"color":"C0CAD6","cMask":["c0"],"cGroup":["ball","c1"],"trait":"ciary"},{"v0":150,"v1":151,"color":"C0CAD6","cMask":["c0"],"cGroup":["ball","c1"],"trait":"ciary"},{"v0":152,"v1":153,"curve":0,"color":"C0CAD6","cMask":["c0"],"cGroup":["ball","c1"],"trait":"ciary"},{"v0":154,"v1":155,"color":"C0CAD6","cMask":["c0"],"cGroup":["ball","c1"],"trait":"ciary"},{"v0":156,"v1":157,"color":"C0CAD6","cMask":["c0"],"cGroup":["ball","c1"],"trait":"ciary"},{"v0":158,"v1":159,"color":"C0CAD6","cMask":["c0"],"cGroup":["ball","c1"],"trait":"ciary"},{"v0":160,"v1":161,"color":"C0CAD6","cMask":["c0"],"cGroup":["ball","c1"],"trait":"ciary"},{"v0":162,"v1":163,"color":"C0CAD6","cMask":["c0"],"cGroup":["ball","c1"],"trait":"ciary"},{"v0":164,"v1":165,"color":"C0CAD6","cMask":["c0"],"cGroup":["ball","c1"],"trait":"ciary"},{"v0":166,"v1":167,"color":"C0CAD6","cMask":["c0"],"cGroup":["ball","c1"],"trait":"ciary"},{"v0":168,"v1":169,"color":"C0CAD6","cMask":["c0"],"cGroup":["ball","c1"],"trait":"ciary"},{"v0":170,"v1":171,"color":"C0CAD6","cMask":["c0"],"cGroup":["ball","c1"],"trait":"ciary"},{"v0":172,"v1":173,"color":"C0CAD6","cMask":["c0"],"cGroup":["ball","c1"],"trait":"ciary"},{"v0":174,"v1":175,"color":"C0CAD6","cMask":["c0"],"cGroup":["ball","c1"],"trait":"ciary"},{"v0":176,"v1":177,"color":"C0CAD6","cMask":["c0"],"cGroup":["ball","c1"],"trait":"ciary"},{"v0":178,"v1":179,"color":"C0CAD6","cMask":["c0"],"cGroup":["ball","c1"],"trait":"ciary"},{"v0":180,"v1":181,"color":"C0CAD6","cMask":["c0"],"cGroup":["ball","c1"],"trait":"ciary"},{"v0":182,"v1":183,"color":"C0CAD6","cMask":["c0"],"cGroup":["ball","c1"],"trait":"ciary"},{"v0":184,"v1":185,"color":"C0CAD6","cMask":["c0"],"cGroup":["ball","c1"],"trait":"ciary"},{"v0":186,"v1":187,"color":"C0CAD6","cMask":["c0"],"cGroup":["ball","c1"],"trait":"ciary"},{"v0":188,"v1":189,"color":"C0CAD6","cMask":["c0"],"cGroup":["ball","c1"],"trait":"ciary"},{"v0":190,"v1":191,"color":"C0CAD6","cMask":["c0"],"cGroup":["ball","c1"],"trait":"ciary"},{"v0":192,"v1":193,"curve":0,"color":"C0CAD6","trait":"ciary"},{"v0":194,"v1":195,"color":"C0CAD6","cMask":["c0"],"cGroup":["ball","c1"],"trait":"ciary"},{"v0":196,"v1":197,"color":"C0CAD6","cMask":["c0"],"cGroup":["ball","c1"],"trait":"ciary"},{"v0":198,"v1":199,"color":"C0CAD6","cMask":["c0"],"cGroup":["ball","c1"],"trait":"ciary"},{"v0":200,"v1":201,"color":"C0CAD6","cMask":["c0"],"cGroup":["ball","c1"],"trait":"ciary"},{"v0":202,"v1":203,"color":"C0CAD6","cMask":["c0"],"cGroup":["ball","c1"],"trait":"ciary"},{"v0":204,"v1":205,"color":"C0CAD6","cMask":["c0"],"cGroup":["ball","c1"],"trait":"ciary"},{"v0":206,"v1":207,"color":"C0CAD6","cMask":["c0"],"cGroup":["ball","c1"],"trait":"ciary"},{"v0":208,"v1":209,"color":"C0CAD6","cMask":["c0"],"cGroup":["ball","c1"],"trait":"ciary"},{"v0":210,"v1":211,"curve":0,"color":"C0CAD6","cMask":["c0"],"cGroup":["ball","c1"],"trait":"ciary"},{"v0":212,"v1":213,"color":"C0CAD6","cMask":["c0"],"cGroup":["ball","c1"],"trait":"ciary"},{"v0":214,"v1":215,"color":"C0CAD6","cMask":["c0"],"cGroup":["ball","c1"],"trait":"ciary"},{"v0":216,"v1":217,"curve":0,"color":"C0CAD6","cMask":["c0"],"cGroup":["ball","c1"],"trait":"ciary"},{"v0":218,"v1":219,"curve":0,"color":"C0CAD6","cMask":["c0"],"cGroup":["ball","c1"],"trait":"ciary"},{"v0":220,"v1":221,"curve":0,"color":"C0CAD6","cMask":["c0"],"cGroup":["ball","c1"],"trait":"ciary"},{"v0":222,"v1":223,"curve":0,"color":"C0CAD6","cMask":["c0"],"cGroup":["ball","c1"],"trait":"ciary"},{"v0":224,"v1":225,"curve":0,"color":"C0CAD6","cMask":["c0"],"cGroup":["ball","c1"],"trait":"ciary"},{"v0":226,"v1":227,"curve":0,"color":"C0CAD6","cMask":["c0"],"cGroup":["ball","c1"],"trait":"ciary"},{"v0":228,"v1":229,"color":"C0CAD6","cMask":["c0"],"cGroup":["ball","c1"],"trait":"ciary"},{"v0":230,"v1":231,"color":"C0CAD6","cMask":["c0"],"cGroup":["ball","c1"],"trait":"ciary","y":-16},{"v0":232,"v1":233,"color":"C0CAD6","cMask":["c0"],"cGroup":["ball","c1"],"trait":"ciary"},{"v0":234,"v1":235,"color":"C0CAD6","cMask":["c0"],"cGroup":["ball","c1"],"trait":"ciary"},{"v0":236,"v1":237,"color":"C0CAD6","cMask":["c0"],"cGroup":["ball","c1"],"trait":"ciary"},{"v0":238,"v1":239,"color":"C0CAD6","cMask":["c0"],"cGroup":["ball","c1"],"trait":"ciary"},{"v0":240,"v1":241,"color":"C0CAD6","cMask":["c0"],"cGroup":["ball","c1"],"trait":"ciary"},{"v0":242,"v1":243,"color":"C0CAD6","cMask":["c0"],"cGroup":["ball","c1"],"trait":"ciary"},{"v0":244,"v1":245,"color":"C0CAD6","cMask":["c0"],"cGroup":["ball","c1"],"trait":"ciary"},{"v0":246,"v1":247,"color":"C0CAD6","cMask":["c0"],"cGroup":["ball","c1"],"trait":"ciary"},{"v0":248,"v1":249,"color":"C0CAD6","cMask":["c0"],"cGroup":["ball","c1"],"trait":"ciary"},{"v0":250,"v1":251,"curve":120,"color":"737573","cMask":["wall"],"cGroup":["wall"],"x":-325}],"planes":[{"normal":[0,1],"dist":-240,"bCoef":1,"cMask":["ball"],"_data":{"extremes":{"normal":[0,1],"dist":-240,"canvas_rect":[-742,-270,742,270],"a":[-742,-240],"b":[742,-240]}}},{"normal":[0,-1],"dist":-240,"bCoef":1,"cMask":["ball"],"_data":{"extremes":{"normal":[0,-1],"dist":-240,"canvas_rect":[-742,-270,742,270],"a":[-742,240],"b":[742,240]}}},{"normal":[0,1],"dist":-270,"bCoef":0.1,"_data":{"extremes":{"normal":[0,1],"dist":-270,"canvas_rect":[-742,-270,742,270],"a":[-742,-270],"b":[742,-270]}}},{"normal":[0,-1],"dist":-270,"bCoef":0.1,"_data":{"extremes":{"normal":[0,-1],"dist":-270,"canvas_rect":[-742,-270,742,270],"a":[-742,270],"b":[742,270]}}},{"normal":[1,0],"dist":-660,"bCoef":0.1,"_data":{"extremes":{"normal":[1,0],"dist":-660,"canvas_rect":[-742,-270,742,270],"a":[-742,-270],"b":[-660,270]}}},{"normal":[-1,0],"dist":-668,"bCoef":0.1,"_data":{"extremes":{"normal":[-1,0],"dist":-668,"canvas_rect":[-742,-270,742,270],"a":[668,-270],"b":[668,270]}}},{"normal":[1,0],"dist":-659,"bCoef":0.1,"cMask":["ball"],"_data":{"extremes":{"normal":[1,0],"dist":-659,"canvas_rect":[-742,-270,742,270],"a":[-659,-270],"b":[-659,270]}}},{"normal":[-1,0],"dist":-669,"bCoef":0.1,"cMask":["ball"],"_data":{"extremes":{"normal":[-1,0],"dist":-669,"canvas_rect":[-742,-270,742,270],"a":[669,-270],"b":[669,270]}}}],"goals":[{"p0":[554,81],"p1":[554,-81],"team":"blue","cGroup":["ball","c1"],"cMask":["c0"],"color":"C0CAD6"},{"p0":[-554,81],"p1":[-554,81],"team":"red"},{"p0":[-554.9475388613222,-78.6481942492205],"p1":[-554.2125090085257,79.38322410201695],"team":"red"},{"p0":[-556,83],"p1":[-556,-79],"team":"red","color":"C0CAD6"},{"p0":[554,81],"p1":[554,-81],"team":"blue","cGroup":["ball","c1"],"cMask":["c0"],"color":"C0CAD6"}],"discs":[{"radius":5,"invMass":0,"pos":[-550,80],"color":"C0CAD6","cMask":["red","blue","all"],"cGroup":["wall"],"trait":"goalPost","_data":{"mirror":{}}},{"radius":5,"invMass":0,"pos":[-550,-80],"color":"C0CAD6","cMask":["red","blue","all"],"cGroup":["wall"],"trait":"goalPost","_data":{"mirror":{}}},{"radius":5.4,"invMass":0,"pos":[550,80],"color":"C0CAD6","cMask":["red","blue","all"],"cGroup":["wall"],"trait":"goalPost","_data":{"mirror":{}}},{"radius":5.4,"invMass":0,"pos":[550,-80],"color":"C0CAD6","cMask":["red","blue","all"],"cGroup":["wall"],"trait":"goalPost","_data":{"mirror":{}}}],"playerPhysics":{"bCoef":0,"acceleration":0.11,"kickingAcceleration":0.083,"kickStrength":4.545,"radius":15,"invMass":0.5,"damping":0.96,"kickingDamping":0.96,"kickback":0},"ballPhysics":{"radius":5.8,"bCoef":0.412,"invMass":1.5,"color":"ffcc00","damping":0.99,"cMask":["all"],"gravity":[0,0],"cGroup":["ball"]},"spawnDistance":350,"joints":[],"traits":{},"redSpawnPoints":[],"blueSpawnPoints":[],"canBeStored":false,"cameraWidth":0,"cameraHeight":0,"maxViewWidth":0,"cameraFollow":"ball","kickOffReset":"partial"}`;

    room.setCustomStadium(stadium);
    room.setScoreLimit(0);
    room.setTimeLimit(0);

    room.onRoomLink = (link) => {
        console.log(`Sala: ${link}`);
    };

    // ============================================================
    // CONFIGURATION
    // ============================================================

    const prefijo = "!";
    const halfTimeDuration = 15000;

    let halfTime = 30;

    const paises = [
        { nombre: "paraguay", angle: 90.0, textColor: 0x000000, colors: [0xFF1212, 0xFFFFFF, 0x0800FF], bandera: "🇵🇾" },
        { nombre: "argentina", angle: 90.0, textColor: 0xFFEF08, colors: [0x13C6F2, 0xFFFFFF, 0x13C6F2], bandera: "🇦🇷" },
        { nombre: "francia", angle: 180.0, textColor: 0xFFF700, colors: [0x180091], bandera: "🇫🇷" },
        { nombre: "brasil", angle: 180.0, textColor: 0x11AE3B, colors: [0xFFDC02], bandera: "🇧🇷" },
        { nombre: "uruguay", angle: 180.0, textColor: 0xFFC905, colors: [0x55B5E5], bandera: "🇺🇾" },
        { nombre: "peru", angle: 0.0, textColor: 0x000000, colors: [0xFF0D0D, 0xFFFFFF, 0xFF0000], bandera: "🇵🇪" },
        { nombre: "bolivia", angle: 90.0, textColor: 0xFFFFFF, colors: [0xFF1900, 0xFFD505, 0x00A83E], bandera: "🇧🇴"}
    ];

    const stadiums = {
        futsal: { type: "custom", value: stadium },
        big: { type: "default", value: "Big" },
        small: { type: "default", value: "Small" },
        classic: { type: "default", value: "Classic" },
        hockey: { type: "default", value: "Hockey" }
    };

    // ============================================================
    // MATCH STATE
    // ============================================================

    let currentHalf = 0;
    let halfRunning = false;
    let halftimeTimer = null;

    // teams = orden original del partido.
    let teams = [];

    // fieldTeams = equipo actualmente en RED / BLUE.
    let fieldTeams = [];

    // score = marcador siguiendo SIEMPRE el orden original.
    let score = [0, 0];

    // captainIds = capitán de cada equipo siguiendo el orden original.
    let captainIds = [null, null];

    // ============================================================
    // PLAYER STATE
    // ============================================================

    let playerList = [];
    let playingPlayerList = [];

    // ============================================================
    // TOUCH STATE
    // ============================================================

    let lastTouch = null;
    let secondToLastTouch = null;

    // ============================================================
    // STATISTICS
    // ============================================================

    let stats = [];

    // Se conserva el MVP del último partido para !mvp.
    let lastMatchMvp = null;

    // ============================================================
    // EVENTS
    // ============================================================

    const eventHandlers = {};

    function onEvent(eventName, handler) {
        if (!eventHandlers[eventName]) eventHandlers[eventName] = [];
        eventHandlers[eventName].push(handler);
    }

    function emitEvent(eventName, data = {}) {
        for (const handler of eventHandlers[eventName] ?? []) {
            handler(data);
        }
    }

    // ============================================================
    // GENERIC HELPERS
    // ============================================================

    function isAdmin(player) {
        return player.admin;
    }

    function requireAdmin(player) {
        if (isAdmin(player)) return true;

        room.sendAnnouncement(
            "❌ Este comando requiere permisos de administrador.",
            player.id,
            0xFF0000,
            "bold"
        );

        return false;
    }

    function requireArgCount(player, args, count, usage) {
        if (args.length === count) return true;

        room.sendAnnouncement(
            `❌ Uso: ${usage}`,
            player.id,
            0xFF0000,
            "bold"
        );

        return false;
    }

    function sendError(player, message) {
        room.sendAnnouncement(
            `❌ ${message}`,
            player.id,
            0xFF0000,
            "bold"
        );
    }

    function getCountry(name) {
        if (!name) return undefined;

        return paises.find(
            country => country.nombre === name.toLowerCase()
        );
    }

    function formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;

        return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
    }

    function parseTime(value) {
        if (!value) return null;

        const input = value.toLowerCase();

        if (/^\d+$/.test(input)) {
            return Number(input);
        }

        if (/^\d+s$/.test(input)) {
            return Number(input.slice(0, -1));
        }

        if (/^\d+m$/.test(input)) {
            return Number(input.slice(0, -1)) * 60;
        }

        return null;
    }

    function getPlayerFromName(name) {
        if (!name) return undefined;

        const normalizedName = name.trim().toLowerCase();

        const players = room
            .getPlayerList()
            .filter(player => player.name.toLowerCase() === normalizedName);

        if (players.length === 1) return players[0];
        if (players.length > 1) return null;

        return undefined;
    }

    function getPlayerStats(player) {
        return stats.find(stat => stat.player.id === player.id);
    }

    function getOriginalTeamIndex(teamNumber) {
        const fieldTeam = fieldTeams[teamNumber - 1];

        return teams.indexOf(fieldTeam);
    }

    function getShirtColor(teamNumber) {
        const country = getCountry(fieldTeams[teamNumber - 1]);

        return country?.colors.at(0) ?? 0xFFFFFF;
    }

    // ============================================================
    // ADMINS
    // ============================================================

    function updateAdmins() {
        const players = room.getPlayerList();

        if (players.length === 0) return;

        if (players.find(player => player.admin) !== undefined) return;

        room.setPlayerAdmin(players[0].id, true);
    }

    // ============================================================
    // PLAYER LISTS
    // ============================================================

    function updatePlayerList() {
        playerList = room.getPlayerList();
        playingPlayerList = playerList.filter(player => player.team !== 0);
    }

    // ============================================================
    // STATS
    // ============================================================

    function generateStats(player) {
        if (stats.some(stat => stat.player.id === player.id)) return;

        stats.push({
            player,
            goals: 0,
            assists: 0
        });
    }

    function resetStats() {
        stats = [];

        updatePlayerList();

    }

    function playerScore(player) {
        const stat = getPlayerStats(player);

        if (!stat) return;

        stat.goals++;
    }

    function playerAssist(player) {
        const stat = getPlayerStats(player);

        if (!stat) return;

        stat.assists++;
    }

    // ============================================================
    // SHIRTS / TEAMS
    // ============================================================

    function setTeamShirts(teamNumber, name) {
        const country = getCountry(name);

        if (!country) return false;

        room.setTeamColors(
            teamNumber,
            country.angle,
            country.textColor,
            country.colors
        );

        return true;
    }

    function setTeams(team1, team2) {
        const country1 = getCountry(team1);
        const country2 = getCountry(team2);

        if (!country1 || !country2) return false;
        if (country1.nombre === country2.nombre) return false;

        teams = [country1.nombre, country2.nombre];
        fieldTeams = [...teams];
        score = [0, 0];
        captainIds = [null, null];

        setTeamShirts(1, fieldTeams[0]);
        setTeamShirts(2, fieldTeams[1]);

        return true;
    }

    function swapShirts() {
        [fieldTeams[0], fieldTeams[1]] = [
            fieldTeams[1],
            fieldTeams[0]
        ];

        setTeamShirts(1, fieldTeams[0]);
        setTeamShirts(2, fieldTeams[1]);
    }

    // ============================================================
    // TEAM SWAP
    // ============================================================

    function swapTeams() {
        const players = room
            .getPlayerList()
            .filter(player => player.team !== 0);

        const swaps = players.map(player => ({
            id: player.id,
            team: player.team
        }));

        for (const player of swaps) {
            room.setPlayerTeam(player.id, 0);
        }

        setTimeout(() => {
            for (const player of swaps) {
                const newTeam = player.team === 1 ? 2 : 1;

                room.setPlayerTeam(player.id, newTeam);
            }

            swapShirts();
            updatePlayerList();
        }, 100);
    }

    // ============================================================
    // TOUCH STATE
    // ============================================================

    function resetLastTouch() {
        lastTouch = null;
        secondToLastTouch = null;
    }

    // ============================================================
    // GOALS
    // ============================================================

    function checkPlayerGoal(teamNumber) {
        if (lastTouch === null) return null;

        const player = room.getPlayer(lastTouch);

        if (!player) return null;

        if (player.team !== teamNumber) {
            return null;
        }

        playerScore(player);
        checkPlayerAssist(player);

        return player;
    }

    function checkPlayerAssist(player) {
        if (secondToLastTouch === null) return null;

        const assister = room.getPlayer(secondToLastTouch);

        if (!assister) return null;

        if (assister.id === player.id) return null;
        if (assister.team !== player.team) return null;

        playerAssist(assister);

        return assister;
    }

    // ============================================================
    // MATCH LIFECYCLE
    // ============================================================

    function startFirstHalf() {
        clearTimeout(halftimeTimer);

        currentHalf = 1;
        halfRunning = true;

        fieldTeams = [...teams];
        score = [0, 0];
        captainIds = [null, null];

        setTeamShirts(1, fieldTeams[0]);
        setTeamShirts(2, fieldTeams[1]);

        resetStats();
        resetLastTouch();

        room.startGame();

        emitEvent("matchStart", {
            half: 1
        });
    }

    function startSecondHalf() {
        currentHalf = 2;
        halfRunning = true;

        resetLastTouch();

        room.startGame();

        emitEvent("secondHalfStart", {
            half: 2
        });
    }

    function startHalftime() {
        halfRunning = false;
        currentHalf = 0;

        const halftimeScore = [...score];

        room.stopGame();
        resetLastTouch();

        emitEvent("halftime", {
            score: halftimeScore
        });

        swapTeams();

        halftimeTimer = setTimeout(() => {
            halftimeTimer = null;

            startSecondHalf();
        }, halfTimeDuration);
    }

    function finishMatch() {
        halfRunning = false;

        room.stopGame();
        resetLastTouch();

        const finalScore = [...score];
        const finalStats = [...stats];

        lastMatchMvp = calculateMvp(finalStats);

        emitEvent("matchEnd", {
            score: finalScore,
            stats: finalStats,
            mvp: lastMatchMvp
        });

        console.log("====================================");
        console.log("ESTADÍSTICAS DEL PARTIDO");

        for (const stat of finalStats) {
            console.log(
                `${stat.player.name}: ${stat.goals} gol/es, ${stat.assists} asistencia/s`
            );
        }

        if (lastMatchMvp) {
            console.log(
                `MVP: ${lastMatchMvp.player.name} (${lastMatchMvp.points} puntos)`
            );
        }

        console.log("====================================");

        score = [0, 0];
        currentHalf = 0;

        resetStats();

        fieldTeams = [...teams];

        setTeamShirts(1, fieldTeams[0]);
        setTeamShirts(2, fieldTeams[1]);
    }

    function stopMatch() {
        clearTimeout(halftimeTimer);
        halftimeTimer = null;

        if (room.getScores()) {
            room.stopGame();
        }

        currentHalf = 0;
        halfRunning = false;

        resetLastTouch();

        score = [0, 0];
        captainIds = [null, null];

        fieldTeams = [...teams];

        if (fieldTeams.length === 2) {
            setTeamShirts(1, fieldTeams[0]);
            setTeamShirts(2, fieldTeams[1]);
        }

        resetStats();

        emitEvent("matchStop");
    }

    // ============================================================
    // MVP
    // ============================================================

    function calculateMvp(matchStats) {
        if (matchStats.length === 0) return null;

        const candidates = matchStats.map(stat => ({
            ...stat,
            points: stat.goals * 3 + stat.assists * 2
        }));

        candidates.sort((a, b) => {
            if (b.points !== a.points) {
                return b.points - a.points;
            }

            if (b.goals !== a.goals) {
                return b.goals - a.goals;
            }

            return b.assists - a.assists;
        });

        const mvp = candidates[0];

        if (mvp.points === 0) return null;

        return mvp;
    }

    // ============================================================
    // INFORMATION COMMANDS
    // ============================================================

    function showScore(player) {
        if (teams.length < 2) {
            sendError(player, "Todavía no se definieron los equipos.");
            return;
        }

        room.sendAnnouncement(
            `⚽ ${getCountry(teams[0]).bandera} ${teams[0].toUpperCase()} ${score[0]} - ${score[1]} ${teams[1].toUpperCase()} ${getCountry(teams[1]).bandera}`,
            player.id,
            0xFFFFFF,
            "bold"
        );
    }

    function showTime(player) {
        const scores = room.getScores();

        if (!scores) {
            room.sendAnnouncement(
                "⏸️ No hay un partido en curso.",
                player.id,
                0xFFFF00
            );

            return;
        }

        const halfName = currentHalf === 1
            ? "PRIMER TIEMPO"
            : "SEGUNDO TIEMPO";

        room.sendAnnouncement(
            `⏱️ ${halfName} - ${formatTime(Math.floor(scores.time))}`,
            player.id,
            0xFFFFFF,
            "bold"
        );
    }

    function showTeams(player) {
        if (fieldTeams.length < 2) {
            sendError(player, "Todavía no se definieron los equipos.");
            return;
        }

        const redPlayers = room
            .getPlayerList()
            .filter(currentPlayer => currentPlayer.team === 1);

        const bluePlayers = room
            .getPlayerList()
            .filter(currentPlayer => currentPlayer.team === 2);

        const redCountry = getCountry(fieldTeams[0]);
        const blueCountry = getCountry(fieldTeams[1]);

        const redCaptainId = captainIds[teams.indexOf(fieldTeams[0])];
        const blueCaptainId = captainIds[teams.indexOf(fieldTeams[1])];

        const redNames = redPlayers.length > 0
            ? redPlayers.map(currentPlayer => {
                const captain = currentPlayer.id === redCaptainId ? "⭐ " : "";
                return `${captain}${currentPlayer.name}`;
            }).join(", ")
            : "Vacío";

        const blueNames = bluePlayers.length > 0
            ? bluePlayers.map(currentPlayer => {
                const captain = currentPlayer.id === blueCaptainId ? "⭐ " : "";
                return `${captain}${currentPlayer.name}`;
            }).join(", ")
            : "Vacío";

        room.sendAnnouncement(
            `${redCountry.bandera} ${redCountry.nombre.toUpperCase()}: ${redNames}`,
            player.id,
            0xFFFFFF,
            "bold"
        );

        room.sendAnnouncement(
            `${blueCountry.bandera} ${blueCountry.nombre.toUpperCase()}: ${blueNames}`,
            player.id,
            0xFFFFFF,
            "bold"
        );
    }

    function showLineup(player) {
        const redPlayers = room
            .getPlayerList()
            .filter(currentPlayer => currentPlayer.team === 1);

        const bluePlayers = room
            .getPlayerList()
            .filter(currentPlayer => currentPlayer.team === 2);

        const spectators = room
            .getPlayerList()
            .filter(currentPlayer => currentPlayer.team === 0);

        const redCountry = getCountry(fieldTeams[0]);
        const blueCountry = getCountry(fieldTeams[1]);

        room.sendAnnouncement(
            `${redCountry?.bandera ?? "🔴"} ${redCountry?.nombre?.toUpperCase() ?? "RED"}: ${redPlayers.map(currentPlayer => currentPlayer.name).join(", ") || "Vacío"}`,
            player.id,
            0xFFFFFF
        );

        room.sendAnnouncement(
            `${blueCountry?.bandera ?? "🔵"} ${blueCountry?.nombre?.toUpperCase() ?? "BLUE"}: ${bluePlayers.map(currentPlayer => currentPlayer.name).join(", ") || "Vacío"}`,
            player.id,
            0xFFFFFF
        );

        room.sendAnnouncement(
            `👀 ESPECTADORES: ${spectators.map(currentPlayer => currentPlayer.name).join(", ") || "Ninguno"}`,
            player.id,
            0xFFFFFF
        );
    }

    function showStats(player) {
        if (stats.length === 0) {
            sendError(player, "No hay estadísticas.");
            return;
        }

        const orderedStats = [...stats].sort((a, b) => {
            if (b.goals !== a.goals) return b.goals - a.goals;
            return b.assists - a.assists;
        });

        room.sendAnnouncement(
            "📊 ESTADÍSTICAS",
            player.id,
            0xFFFFFF,
            "bold"
        );

        for (const stat of orderedStats) {
            room.sendAnnouncement(
                `${stat.player.name}: ⚽ ${stat.goals} | 🅰️ ${stat.assists}`,
                player.id,
                0xFFFFFF
            );
        }
    }

    function showMvp(player) {
        if (!lastMatchMvp) {
            const currentMvp = calculateMvp(stats);

            if (!currentMvp) {
                sendError(player, "Todavía no hay un MVP.");
                return;
            }

            lastMatchMvp = currentMvp;
        }

        room.sendAnnouncement(
            `🏆 MVP: ${lastMatchMvp.player.name.toUpperCase()} - ⚽ ${lastMatchMvp.goals} | 🅰️ ${lastMatchMvp.assists} | ${lastMatchMvp.points} puntos`,
            player.id,
            0xFFD700,
            "bold"
        );
    }

    function showPlayers(player) {
        const players = room.getPlayerList();

        if (players.length === 0) {
            sendError(player, "No hay jugadores en la sala.");
            return;
        }

        room.sendAnnouncement(
            `👥 ${players.map(currentPlayer => currentPlayer.name).join(", ")}`,
            player.id,
            0xFFFFFF
        );
    }

    function showHelp(player) {
        room.sendAnnouncement(
            "📖 !score | !teams | !lineup | !time | !stats | !mvp | !players | !help",
            player.id,
            0xFFFFFF
        );

        if (player.admin) {
            room.sendAnnouncement(
                "🔧 Admin: !iniciar | !stop | !pause | !resume | !camisetas | !tiempo | !estadio | !sub | !captain",
                player.id,
                0xFFFF00
            );
        }
    }

    // ============================================================
    // ADMIN COMMANDS
    // ============================================================

    function setStadium(name) {
        const config = stadiums[name];

        if (!config) return false;

        if (config.type === "custom") {
            room.setCustomStadium(config.value);
        } else {
            room.setDefaultStadium(config.value);
        }

        return true;
    }

    function pauseMatch() {
        room.pauseGame(true);
        halfRunning = false;

        emitEvent("pause");
    }

    function resumeMatch() {
        room.pauseGame(false);
        halfRunning = true;

        emitEvent("resume");
    }

    function substitutePlayers(enteringPlayer, leavingPlayer) {
        const leavingTeam = leavingPlayer.team;

        room.setPlayerTeam(leavingPlayer.id, 0);

        room.setPlayerTeam(enteringPlayer.id, leavingTeam);

        updatePlayerList();

        emitEvent("substitution", {
            enteringPlayer,
            leavingPlayer
        });
    }

    function setCaptain(player) {
        if (player.team === 0) return false;

        const teamIndex = getOriginalTeamIndex(player.team);

        if (teamIndex === -1) return false;

        captainIds[teamIndex] = player.id;

        emitEvent("captain", {
            player,
            team: teams[teamIndex]
        });

        return true;
    }

    // ============================================================
    // EVENTS: DEFAULT HANDLERS
    // ============================================================

    onEvent("matchStart", () => {
        room.sendAnnouncement(
            "⚽ ¡COMIENZA EL PRIMER TIEMPO!",
            null,
            0xFFFFFF,
            "bold"
        );
    });

    onEvent("secondHalfStart", () => {
        room.sendAnnouncement(
            "⚽ ¡COMIENZA EL SEGUNDO TIEMPO!",
            null,
            0xFFFFFF,
            "bold"
        );
    });

    onEvent("halftime", ({ score: halftimeScore }) => {
        room.sendAnnouncement(
            "⏸️ ¡FIN DEL PRIMER TIEMPO!",
            null,
            0xFFFF00,
            "bold"
        );

        room.sendAnnouncement(
            `📊 PARCIAL: ${teams[0].toUpperCase()} ${halftimeScore[0]} - ${halftimeScore[1]} ${teams[1].toUpperCase()}`,
            null,
            0xFFFFFF,
            "bold"
        );

        room.sendAnnouncement(
            "🔄 Cambiando de lado...",
            null,
            0xFFFFFF,
            "bold"
        );
    });

    onEvent("matchEnd", ({ score: finalScore, mvp }) => {
        room.sendAnnouncement(
            `🏁 ¡FINAL DEL PARTIDO! ${teams[0].toUpperCase()} ${finalScore[0]} - ${finalScore[1]} ${teams[1].toUpperCase()}`,
            null,
            0xFFD700,
            "bold"
        );

        if (mvp) {
            room.sendAnnouncement(
                `🏆 MVP: ${mvp.player.name.toUpperCase()} - ⚽ ${mvp.goals} | 🅰️ ${mvp.assists}`,
                null,
                0xFFD700,
                "bold"
            );
        }
    });

    onEvent("matchStop", () => {
        room.sendAnnouncement(
            "🛑 ¡PARTIDO DETENIDO!",
            null,
            0xFF0000,
            "bold"
        );
    });

    onEvent("pause", () => {
        room.sendAnnouncement(
            "⏸️ Partido pausado.",
            null,
            0xFFFF00,
            "bold"
        );
    });

    onEvent("resume", () => {
        room.sendAnnouncement(
            "▶️ Partido reanudado.",
            null,
            0x00FF00,
            "bold"
        );
    });

    onEvent("substitution", ({ enteringPlayer, leavingPlayer }) => {
        room.sendAnnouncement(
            `🔄 CAMBIO: entra ${enteringPlayer.name.toUpperCase()} por ${leavingPlayer.name.toUpperCase()}`,
            null,
            0xFFFFFF,
            "bold"
        );
    });

    onEvent("captain", ({ player, team }) => {
        const country = getCountry(team);

        room.sendAnnouncement(
            `${country?.bandera ?? "⭐"} ${player.name.toUpperCase()} es ahora capitán de ${team.toUpperCase()}.`,
            null,
            0xFFFFFF,
            "bold"
        );
    });

    onEvent("goal", ({ teamNumber, scorer, assister }) => {
        const fieldTeam = fieldTeams[teamNumber - 1];
        const country = getCountry(fieldTeam);

        const scoreIndex = teams.indexOf(fieldTeam);

        score[scoreIndex]++;

        let message = `${country.bandera} ¡GOOOOOL DE ${scorer ? scorer.name.toUpperCase() : fieldTeam.toUpperCase()}!`;

        if (assister) {
            message += ` 🅰️ ${assister.name.toUpperCase()}`;
        }

        message += ` ¡EL PARTIDO VA ${teams[0].toUpperCase()} ${score[0]} - ${score[1]} ${teams[1].toUpperCase()}!`;

        room.sendAnnouncement(
            message,
            null,
            getShirtColor(teamNumber),
            "bold"
        );
    });

    onEvent("goalUnknownScorer", ({ teamNumber }) => {
        const fieldTeam = fieldTeams[teamNumber - 1];
        const country = getCountry(fieldTeam);

        const scoreIndex = teams.indexOf(fieldTeam);

        score[scoreIndex]++;

        room.sendAnnouncement(
            `${country.bandera} ¡GOOOOOL DE ${fieldTeam.toUpperCase()}! ¡EL PARTIDO VA ${teams[0].toUpperCase()} ${score[0]} - ${score[1]} ${teams[1].toUpperCase()}!`,
            null,
            getShirtColor(teamNumber),
            "bold"
        );
    });

    // ============================================================
    // ROOM EVENTS
    // ============================================================

    room.onPlayerJoin = function(player) {
        updateAdmins();
        updatePlayerList();
        generateStats(player);
    };

    room.onPlayerLeave = function() {
        updateAdmins();
        updatePlayerList();
    };

    room.onPlayerTeamChange = function() {
        updatePlayerList();

        for (const player of playingPlayerList) {
            generateStats(player);
        }
    };

    room.onGameTick = function() {
        const scores = room.getScores();

        if (!scores) return;

        if (currentHalf !== 1 && currentHalf !== 2) return;

        if (scores.time >= halfTime) {
            if (currentHalf === 1) {
                score[0] = scores.red;
                score[1] = scores.blue;

                startHalftime();
            } else {
                finishMatch();
            }

            return;
        }

        if (!halfRunning) return;

        const ball = room.getBallPosition();

        if (!ball) return;

        const players = room
            .getPlayerList()
            .filter(player => player.team !== 0);

        for (const player of players) {
            if (!player.position) continue;

            const dx = player.position.x - ball.x;
            const dy = player.position.y - ball.y;

            const distance = Math.hypot(dx, dy);

            if (distance < 26 && lastTouch !== player.id) {
                secondToLastTouch = lastTouch;
                lastTouch = player.id;
            }
        }
    };

    room.onTeamGoal = function(teamNumber) {
        const scorer = checkPlayerGoal(teamNumber);
        const assister = scorer
            ? room.getPlayer(secondToLastTouch)
            : null;

        if (scorer) {
            emitEvent("goal", {
                teamNumber,
                scorer,
                assister: assister && assister.id !== scorer.id && assister.team === scorer.team
                    ? assister
                    : null
            });
        } else {
            emitEvent("goalUnknownScorer", {
                teamNumber
            });
        }

        resetLastTouch();
    };

    room.onPlayerTeamChange = function (changedPlayer, byPlayer) {
        for (const player of playerList) {
            if (player.team === 1 || player.team === 2) {
                generateStats(player);
            }
        }
    }

    // ============================================================
    // COMMANDS
    // ============================================================

    room.onPlayerChat = function(player, message) {
        if (!message.startsWith(prefijo)) {
            return true;
        }

        const args = message
            .slice(prefijo.length)
            .trim()
            .split(/\s+/);

        const command = (args.shift() ?? "").toLowerCase();

        switch (command) {

            // ====================================================
            // GENERAL
            // ====================================================

            case "hola": {
                if (!requireArgCount(player, args, 0, "!hola")) {
                    return false;
                }

                room.sendAnnouncement(
                    `¡Hola, ${player.name}! Bienvenido a la sala.`,
                    null,
                    0x00FF00,
                    "bold"
                );

                return false;
            }

            case "score": {
                if (!requireArgCount(player, args, 0, "!score")) {
                    return false;
                }

                showScore(player);
                return false;
            }

            case "teams": {
                if (!requireArgCount(player, args, 0, "!teams")) {
                    return false;
                }

                showTeams(player);
                return false;
            }

            case "lineup": {
                if (!requireArgCount(player, args, 0, "!lineup")) {
                    return false;
                }

                showLineup(player);
                return false;
            }

            case "time": {
                if (!requireArgCount(player, args, 0, "!time")) {
                    return false;
                }

                showTime(player);
                return false;
            }

            case "stats": {
                if (!requireArgCount(player, args, 0, "!stats")) {
                    return false;
                }

                showStats(player);
                return false;
            }

            case "mvp": {
                if (!requireArgCount(player, args, 0, "!mvp")) {
                    return false;
                }

                showMvp(player);
                return false;
            }

            case "players": {
                if (!requireArgCount(player, args, 0, "!players")) {
                    return false;
                }

                showPlayers(player);
                return false;
            }

            case "help": {
                if (!requireArgCount(player, args, 0, "!help")) {
                    return false;
                }

                showHelp(player);
                return false;
            }

            // ====================================================
            // ADMIN
            // ====================================================

            case "iniciar": {
                if (!requireAdmin(player)) return false;

                if (!requireArgCount(player, args, 0, "!iniciar")) {
                    return false;
                }

                if (currentHalf !== 0) {
                    sendError(player, "Ya hay un partido en curso.");
                    return false;
                }

                if (teams.length !== 2) {
                    sendError(
                        player,
                        "Primero definí los equipos con !camisetas."
                    );

                    return false;
                }

                startFirstHalf();
                return false;
            }

            case "stop": {
                if (!requireAdmin(player)) return false;

                if (!requireArgCount(player, args, 0, "!stop")) {
                    return false;
                }

                stopMatch();
                return false;
            }

            case "pause": {
                if (!requireAdmin(player)) return false;

                if (!requireArgCount(player, args, 0, "!pause")) {
                    return false;
                }

                if (currentHalf === 0) {
                    sendError(player, "No hay un partido en curso.");
                    return false;
                }

                if (!halfRunning) {
                    sendError(player, "El partido ya está pausado.");
                    return false;
                }

                pauseMatch();
                return false;
            }

            case "resume": {
                if (!requireAdmin(player)) return false;

                if (!requireArgCount(player, args, 0, "!resume")) {
                    return false;
                }

                if (currentHalf === 0) {
                    sendError(player, "No hay un partido en curso.");
                    return false;
                }

                if (halfRunning) {
                    sendError(player, "El partido ya está en curso.");
                    return false;
                }

                resumeMatch();
                return false;
            }

            case "camisetas": {
                if (!requireAdmin(player)) return false;

                if (!requireArgCount(
                    player,
                    args,
                    2,
                    "!camisetas <pais 1> <pais 2>"
                )) {
                    return false;
                }

                if (currentHalf !== 0) {
                    sendError(
                        player,
                        "No podés cambiar las camisetas durante un partido."
                    );

                    return false;
                }

                const team1 = args[0].toLowerCase();
                const team2 = args[1].toLowerCase();

                if (!getCountry(team1)) {
                    sendError(player, `No existe el país "${team1}".`);
                    return false;
                }

                if (!getCountry(team2)) {
                    sendError(player, `No existe el país "${team2}".`);
                    return false;
                }

                if (team1 === team2) {
                    sendError(
                        player,
                        "Los dos países deben ser diferentes."
                    );

                    return false;
                }

                setTeams(team1, team2);
                lastMatchMvp = null;

                room.sendAnnouncement(
                    `👕 ${getCountry(team1).bandera} ${team1.toUpperCase()} vs ${team2.toUpperCase()} ${getCountry(team2).bandera}`,
                    null,
                    0xFFFFFF,
                    "bold"
                );

                return false;
            }

            case "tiempo": {
                if (!requireAdmin(player)) return false;

                if (!requireArgCount(
                    player,
                    args,
                    1,
                    "!tiempo <segundos|Ns|Nm>"
                )) {
                    return false;
                }

                if (currentHalf !== 0) {
                    sendError(
                        player,
                        "El tiempo solo puede modificarse antes del partido."
                    );

                    return false;
                }

                const newTime = parseTime(args[0]);

                if (
                    newTime === null ||
                    newTime < 10 ||
                    newTime > 1800
                ) {
                    sendError(
                        player,
                        "El tiempo debe estar entre 10 segundos y 30 minutos."
                    );

                    return false;
                }

                halfTime = newTime;

                room.sendAnnouncement(
                    `⏱️ Cada tiempo durará ${formatTime(halfTime)}.`,
                    null,
                    0xFFFFFF,
                    "bold"
                );

                return false;
            }

            case "estadio": {
                if (!requireAdmin(player)) return false;

                if (!requireArgCount(
                    player,
                    args,
                    1,
                    "!estadio <nombre>"
                )) {
                    return false;
                }

                if (currentHalf !== 0) {
                    sendError(
                        player,
                        "No podés cambiar el estadio durante un partido."
                    );

                    return false;
                }

                const stadiumName = args[0].toLowerCase();

                if (!setStadium(stadiumName)) {
                    sendError(
                        player,
                        `No existe el estadio "${stadiumName}".`
                    );

                    return false;
                }

                room.sendAnnouncement(
                    `🏟️ Estadio cambiado a ${stadiumName.toUpperCase()}.`,
                    null,
                    0xFFFFFF,
                    "bold"
                );

                return false;
            }

            case "captain": {
                if (!requireAdmin(player)) return false;

                if (!requireArgCount(
                    player,
                    args,
                    1,
                    "!captain <jugador>"
                )) {
                    return false;
                }

                const captain = getPlayerFromName(args.join(" "));

                if (captain === undefined) {
                    sendError(
                        player,
                        `No existe un jugador llamado "${args.join(" ")}".`
                    );

                    return false;
                }

                if (captain === null) {
                    sendError(
                        player,
                        "Hay más de un jugador con ese nombre."
                    );

                    return false;
                }

                if (captain.team === 0) {
                    sendError(
                        player,
                        "El capitán debe estar en un equipo."
                    );

                    return false;
                }

                setCaptain(captain);
                return false;
            }

            case "sub": {
                if (!requireAdmin(player)) return false;

                if (!requireArgCount(
                    player,
                    args,
                    2,
                    "!sub <entra> <sale>"
                )) {
                    return false;
                }

                const enteringPlayer = getPlayerFromName(args[0]);
                const leavingPlayer = getPlayerFromName(args[1]);

                if (enteringPlayer === undefined) {
                    sendError(
                        player,
                        `No existe "${args[0]}".`
                    );

                    return false;
                }

                if (leavingPlayer === undefined) {
                    sendError(
                        player,
                        `No existe "${args[1]}".`
                    );

                    return false;
                }

                if (enteringPlayer === null || leavingPlayer === null) {
                    sendError(
                        player,
                        "Hay nombres duplicados. Usá nombres únicos."
                    );

                    return false;
                }

                if (enteringPlayer.team !== 0) {
                    sendError(
                        player,
                        `${enteringPlayer.name} debe ser espectador para entrar como sustituto.`
                    );

                    return false;
                }

                if (leavingPlayer.team === 0) {
                    sendError(
                        player,
                        `${leavingPlayer.name} debe estar jugando para salir.`
                    );

                    return false;
                }

                substitutePlayers(
                    enteringPlayer,
                    leavingPlayer
                );

                return false;
            }

            default: {
                sendError(
                    player,
                    `Comando desconocido: !${command}. Usá !help.`
                );

                return false;
            }
        }
    };
});
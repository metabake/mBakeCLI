"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const FileOpsBase_1 = require("./FileOpsBase");
const bunyan = require('bunyan');
const log = bunyan.createLogger({ name: "class name" });
const fs = require("fs-extra");
const csv2Json = require("csvtojson");
const AdmZip = require("adm-zip");
const download = require("download");
const yaml = require("js-yaml");
class Download {
    constructor(key_, targetDir_) {
        this.key = key_;
        this.targetDir = targetDir_;
    }
    autoUZ() {
        const THIZ = this;
        this.getVal().then(function (url) {
            log.info(url);
            const fn = THIZ.getFn(url);
            log.info(fn);
            THIZ.down(url, fn).then(function () {
                THIZ.unzip(fn);
            });
        });
    }
    auto() {
        const THIZ = this;
        this.getVal().then(function (url) {
            const fn = THIZ.getFn(url);
            THIZ.down(url, fn);
        });
    }
    checkVer(lver) {
        const THIZ = this;
        return new Promise(function (resolve, reject) {
            THIZ.getVal().then(function (ver) {
                if (ver == lver)
                    resolve(true);
                else
                    resolve(false);
            });
        });
    }
    getVal() {
        const THIZ = this;
        return new Promise(function (resolve, reject) {
            download(Download.truth).then(data => {
                let dic = yaml.load(data);
                resolve(dic[THIZ.key]);
            }).catch(err => {
                log.info('err: where is the file?', err);
            });
        });
    }
    getFn(url) {
        const pos = url.lastIndexOf('/');
        return url.substring(pos);
    }
    down(url, fn) {
        const THIZ = this;
        return new Promise(function (resolve, reject) {
            download(url).then(data => {
                fs.writeFileSync(THIZ.targetDir + '/' + fn, data);
                log.info('downloaded');
                resolve('OK');
            }).catch(err => {
                log.info('err: where is the file?', err);
            });
        });
    }
    unzip(fn) {
        const zfn = this.targetDir + fn;
        log.info(zfn);
        const zip = new AdmZip(zfn);
        zip.extractAllTo(this.targetDir, true);
        fs.remove(this.targetDir + '/' + fn);
    }
}
exports.Download = Download;
Download.truth = 'https://Intuition-DEV.github.io/mbCLI/versions.yaml';
class YamlConfig {
    constructor(fn) {
        let cfg = yaml.load(fs.readFileSync(fn));
        log.info(cfg);
        return cfg;
    }
}
exports.YamlConfig = YamlConfig;
class CSV2Json {
    constructor(dir_) {
        if (!dir_ || dir_.length < 1) {
            log.info('no path arg passed');
            return;
        }
        this.dir = FileOpsBase_1.Dirs.slash(dir_);
    }
    convert() {
        const THIZ = this;
        return new Promise(function (resolve, reject) {
            let fn = THIZ.dir + '/list.csv';
            if (!fs.existsSync(fn)) {
                log.info('not found');
                reject('not found');
            }
            log.info('1');
            csv2Json({ noheader: true }).fromFile(fn)
                .then(function (jsonO) {
                log.info(jsonO);
                let fj = THIZ.dir + '/list.json';
                fs.writeFileSync(fj, JSON.stringify(jsonO, null, 3));
                resolve('OK');
            });
        });
    }
}
exports.CSV2Json = CSV2Json;
class DownloadFrag {
    constructor(dir, ops) {
        log.info('Extracting to', dir);
        if (!ops) {
            new Download('headFrag', dir).auto();
            new Download('Bind', dir).auto();
        }
        if (ops) {
            new Download('opsPug', dir).auto();
            new Download('opsJs', dir).auto();
        }
    }
}
exports.DownloadFrag = DownloadFrag;
class VersionNag {
    static isCurrent(prod, ver) {
        const down = new Download(prod, null);
        return down.checkVer(ver);
    }
}
exports.VersionNag = VersionNag;
class FileMethods {
    getDirs(mountPath) {
        let dirs = new FileOpsBase_1.Dirs(mountPath);
        let dirsToIgnore = ['.', '..'];
        return dirs.getShort()
            .map(el => el.replace(/^\/+/g, ''))
            .filter(el => !dirsToIgnore.includes(el));
    }
    getFiles(mountPath, item) {
        let dirs = new FileOpsBase_1.Dirs(mountPath);
        let result = dirs.getInDir(item);
        if (item === '/') {
            return result.filter(file => file.indexOf('/') === -1 && !fs.lstatSync(mountPath + '/' + file).isDirectory());
        }
        else {
            return result;
        }
    }
}
exports.FileMethods = FileMethods;
module.exports = {
    CSV2Json, DownloadFrag, YamlConfig, Download, VersionNag, FileMethods
};

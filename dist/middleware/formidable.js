"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fileparser = void 0;
const formidable_1 = __importDefault(require("formidable"));
// interface ExtendedRequest extends Request {
//   files: any;
// }
const fileparser = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const form = (0, formidable_1.default)();
    form.parse(req, (err, fields, files) => {
        if (err) {
            return next(err);
        }
        console.log('Parsed fields:', fields);
        console.log('Parsed files:', files);
        if (!req.body)
            req.body = {};
        for (let key in fields) {
            const value = fields[key];
            if (value)
                req.body[key] = Array.isArray(value) ? value[0] : value;
        }
        if (!req.files)
            req.files = {};
        for (let key in files) {
            const value = files[key];
            if (value) {
                req.files[key] = value;
            }
        }
        next();
    });
});
exports.fileparser = fileparser;

import list from "postcss/lib/list";
import vars from "postcss-simple-vars";
export class PostCssForPlugin {
    constructor(options) {
        Object.defineProperty(this, "postcssPlugin", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "postcss-fores"
        });
        Object.defineProperty(this, "defaultOptions", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: {
                nested: true
            }
        });
        Object.defineProperty(this, "opts", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "iterStack", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: []
        });
        this.opts = Object.assign(Object.assign({}, this.defaultOptions), options);
    }
    get iterStackLength() {
        return this.iterStack.length;
    }
    clearStack() {
        this.iterStack = [];
    }
    AtRule(rule) {
        if (rule.name === "for") {
            if (rule.parent) {
                this.manageIterStack(rule);
            }
            this.unrollLoop(rule);
        }
        return;
    }
    manageRootIterStack(rule) {
        var _a, _b;
        const parentIterVar = ((_a = rule.parent) === null || _a === void 0 ? void 0 : _a.params) &&
            list.space((_b = rule.parent) === null || _b === void 0 ? void 0 : _b.params)[0];
        if (this.iterStack.indexOf(parentIterVar) === -1) {
            this.clearStack();
            return;
        }
        // If parent is in stack, remove stack after parent
        this.iterStack.splice(this.iterStack.indexOf(parentIterVar) + 1, this.iterStackLength - this.iterStack.indexOf(parentIterVar) - 1);
        this.iterStack.push(list.space(rule.params)[0]);
    }
    manageIterStack(rule) {
        var _a;
        if (((_a = rule.parent) === null || _a === void 0 ? void 0 : _a.type) === "root") {
            return this.manageRootIterStack(rule);
        }
        this.clearStack();
        // Push current rule on stack regardless
        this.iterStack.push(list.space(rule.params)[0]);
    }
    parentsHaveIterator(rule, param) {
        var _a;
        if (rule.parent == null ||
            rule.parent.type === "root" ||
            !((_a = rule.parent) === null || _a === void 0 ? void 0 : _a.params)) {
            return false;
        }
        const parentIterVar = list.space(rule.parent.params);
        if (parentIterVar[0] == null) {
            return false;
        }
        if (parentIterVar[0] === param || this.iterStack.indexOf(param) !== -1) {
            return true;
        }
        return this.parentsHaveIterator(rule.parent, param);
    }
    checkNumber(rule) {
        return (param) => {
            if (isNaN(parseInt(param)) || !param.match(/^-?\d+\.?\d*$/)) {
                if (param.indexOf("$") !== -1) {
                    if (!this.parentsHaveIterator(rule, param)) {
                        throw rule.error("External variable (not from a parent for loop) cannot be used as a range parameter", { plugin: "postcss-for" });
                    }
                }
                else {
                    throw rule.error("Range parameter should be a number", {
                        plugin: "postcss-for"
                    });
                }
            }
        };
    }
    checkParams(rule, params) {
        if (!params[0].match(/(^|[^\w])\$([\w\d-_]+)/) ||
            params[1] !== "from" ||
            params[3] !== "to" ||
            (params[5] !== "by" && params[5] === undefined)) {
            throw rule.error("Wrong loop syntax", { plugin: "postcss-for" });
        }
        [params[2], params[4], params[6] || "0"].forEach(this.checkNumber(rule));
    }
    unrollLoop(rule) {
        var _a;
        const params = list.space(rule.params);
        this.checkParams(rule, params);
        const iterator = params[0].slice(1);
        const index = +params[2];
        const top = +params[4];
        const dir = top < index ? -1 : 1;
        const by = (+params[6] || 1) * dir;
        const value = {};
        for (let i = index; i * dir <= top * dir; i = i + by) {
            const content = rule.clone();
            value[iterator] = i;
            vars({ only: value })(content);
            (_a = rule.parent) === null || _a === void 0 ? void 0 : _a.insertBefore(rule, content.nodes);
        }
        if (rule.parent)
            rule.remove();
    }
}
const pluginExport = (options) => new PostCssForPlugin(options);
pluginExport.postcss = true;
export default pluginExport;

import { type AtRule, type Plugin, PluginCreator } from "postcss";
export interface PluginOptions {
    nested: boolean;
}
export declare class PostCssForPlugin implements Plugin {
    postcssPlugin: string;
    private defaultOptions;
    opts: PluginOptions;
    private iterStack;
    constructor(options: Partial<PluginOptions>);
    get iterStackLength(): number;
    clearStack(): void;
    AtRule(rule: AtRule): void;
    manageRootIterStack(rule: AtRule): void;
    manageIterStack(rule: AtRule): void;
    parentsHaveIterator(rule: AtRule, param: string): boolean;
    checkNumber(rule: AtRule): (param: string) => void;
    checkParams(rule: AtRule, params: string[]): void;
    unrollLoop(rule: AtRule): void;
}
declare const _default: PluginCreator<PluginOptions>;
export default _default;

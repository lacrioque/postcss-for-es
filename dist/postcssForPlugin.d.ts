import { AtRule, Plugin, PluginCreator, ChildNode, Root, Rule } from 'postcss';
export interface PluginOptions {
    nested: boolean;
    debug: boolean;
}
export declare class PostCssForPlugin implements Plugin {
    postcssPlugin: string;
    private defaultOptions;
    opts: PluginOptions;
    private values;
    private rootNode?;
    constructor(options?: Partial<PluginOptions>);
    Log(...args: any[]): void;
    Error(...args: any[]): void;
    AtRule: {
        for: (rule: AtRule) => void;
    };
    isNumber(input: string | number): boolean;
    checkNumber(rule: AtRule, throwError?: boolean): (param: string) => boolean;
    checkParams(rule: AtRule, params: string[], throwError?: boolean): boolean;
    replaceVarsWithValues(nodes: ChildNode[]): ChildNode[];
    replaceVars(key: string, value: string | number, nodes: ChildNode[]): Rule[];
    hasNestedLoops(rule: AtRule): boolean;
    getRootNode(rule: ChildNode): Root;
    getParamFromValues(param: string | number): number | undefined;
    appendClean(nodes: ChildNode[]): void;
    unrollChildLoop(rule: AtRule, parent: AtRule): void;
    unrollRootLoop(rule: AtRule): void;
    unrollLoop(params: string[], rule: AtRule): void;
}
declare const postCssForPlugin: PluginCreator<Partial<PluginOptions>>;
export { postCssForPlugin };

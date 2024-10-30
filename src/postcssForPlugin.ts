import {
  type AtRule,
  type Plugin,
  type PluginCreator,
  type ChildNode,
  type Root,
  Rule
} from "postcss";
import list from "postcss/lib/list";

export interface PluginOptions {
  nested: boolean;
  debug: boolean;
}

export class PostCssForPlugin implements Plugin {
  public postcssPlugin: string = "postcss-fores";

  private defaultOptions: PluginOptions = {
    nested: true,
    debug: false
  };

  public opts: PluginOptions;

  private values = new Map<string, number>();
  private rootNode?: Root;

  constructor(options?: Partial<PluginOptions>) {
    this.opts = options
      ? { ...this.defaultOptions, ...options }
      : this.defaultOptions;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Log(...args: any[]) {
    if (this.opts.debug) {
      console.log(...args);
    }
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Error(...args: any[]) {
    console.error(...args);
  }

  AtRule = {
    for: (rule: AtRule) => {
      if (
        rule.parent?.type === "atrule" &&
        (rule.parent as AtRule)?.name === "for"
      ) {
        return;
      }
      this.unrollRootLoop(rule);
    }
  };

  isNumber(input: string | number): boolean {
    return !isNaN(parseFloat("" + input));
  }

  checkNumber(rule: AtRule, throwError = true) {
    return (param: string): boolean => {
      if (this.isNumber(param)) {
        return true;
      }
      if (!param.match(/^-?\d+\.?\d*$/)) {
        if (param.startsWith("$")) {
          if (this.values.has(param.slice(1))) {
            return true;
          }

          this.Log(
            "External variable (not from a parent for loop) cannot be used as a range parameter",
            param
          );
          if (throwError) {
            throw rule.error(
              "External variable (not from a parent for loop) cannot be used as a range parameter",
              { plugin: "postcss-for" }
            );
          }
        }

        this.Log("Range parameter should be a number", param);
        if (throwError) {
          throw rule.error("Range parameter should be a number", {
            plugin: "postcss-for"
          });
        }
        return false;
      }
      return true;
    };
  }

  checkParams(rule: AtRule, params: string[], throwError = true) {
    if (
      !/(^|[^\w])\$([\w\d_-]+)/.test(params[0]) ||
      params[1] !== "from" ||
      params[3] !== "to" ||
      (params[5] && params[5] !== "by")
    ) {
      this.Log("Wrong loop syntax", params);
      if (throwError) {
        throw rule.error("Wrong loop syntax", { plugin: "postcss-for" });
      }
      return false;
    }
    const checker = this.checkNumber(rule, throwError);
    return [params[2], params[4], params[6] || "0"].some(
      (param) => checker(param) === false
    );
  }

  replaceVarsWithValues(nodes: ChildNode[]): ChildNode[] {
    return Array.from(this.values.keys()).reduce(
      (all, key) => this.replaceVars(key, this.values.get(key)!, all),
      nodes as ChildNode[]
    );
  }

  replaceVars(key: string, value: string | number, nodes: ChildNode[]): Rule[] {
    return nodes.map((node) => {
      const newNode = node.clone();
      if (newNode.type === "rule") {
        newNode.selector = newNode.selector
          .replace(`$${key}`, `${value}`)
          .replace(`$(${key})`, `${value}`)
          .trim();
        newNode.replaceValues(`$(${key})`, `${value}`);
      }
      return newNode;
    }) as Rule[];
  }

  hasNestedLoops(rule: AtRule): boolean {
    return (
      rule.nodes?.some(
        (node) => node.type === "atrule" && (node as AtRule).name === "for"
      ) || false
    );
  }

  getRootNode(rule: ChildNode): Root {
    if (!rule.parent) {
      throw rule.error("Child node cannot access parent", {
        plugin: "postcss-for"
      });
    }
    if (rule && rule?.parent?.type === "root") {
      return rule.parent as Root;
    }

    return this.getRootNode(rule.parent as ChildNode);
  }

  getParamFromValues(param: string | number): number | undefined {
    if (this.isNumber(param)) {
      return parseInt(param as string, 10);
    }
    const valueKey = (param as string).slice(1);
    if (!this.values.has(valueKey)) {
      return;
    }
    return this.values.get(valueKey);
  }

  appendClean(nodes: ChildNode[]) {
    const nodeList = nodes.map((n) => {
      const nn = n.clone();
      nn.raws.before = " ";
      return nn;
    });
    (this.rootNode as Root).append(nodeList);
  }

  unrollChildLoop(rule: AtRule, parent: AtRule) {
    if (!rule.nodes) {
      this.Log("No nodes");
      return;
    }
    const params = list.space(rule.params);

    if (this.checkParams(rule, params)) {
      this.Log("Wrong Params, skipping", params);
      return;
    }
    const iterator = params[0].slice(1);
    const index = this.getParamFromValues(params[2]);
    const top = this.getParamFromValues(params[4]);
    const byNumber = params[6] ? this.getParamFromValues(params[6]) : false;

    if (index === undefined || top === undefined) {
      this.Error(
        "Variables outside of loop scope are not available for looping",
        { params, iterator, index, top, byNumber }
      );
      throw rule.error(
        "Variables outside of loop scope are not available for looping"
      );
    }

    const direction = top < index ? -1 : 1;
    const by = (byNumber || 1) * direction;
    const limit = top * direction;

    for (let i = index; i * direction <= limit; i = i + by) {
      this.values.set(iterator, i);
      const content = rule.clone();
      if (this.hasNestedLoops(rule) && this.opts.nested) {
        (content.nodes as ChildNode[]).forEach((nestedRule) => {
          if (nestedRule.type === "atrule" && nestedRule.name === "for") {
            this.unrollChildLoop(nestedRule as AtRule, parent);
          }
        });
      }

      const newNodes = this.replaceVarsWithValues(content.nodes as Rule[]);
      this.appendClean(newNodes);
      this.values.delete(iterator);
    }

    rule.remove();
  }

  unrollRootLoop(rule: AtRule) {
    if (!this.rootNode) {
      this.rootNode = this.getRootNode(rule) as Root;
    }

    if (!rule.nodes) {
      return;
    }
    const params = list.space(rule.params);

    this.checkParams(rule, params);
    this.unrollLoop(params, rule);
  }

  unrollLoop(params: string[], rule: AtRule) {
    const iterator = params[0].slice(1);
    const index = this.getParamFromValues(params[2]);
    const top = this.getParamFromValues(params[4]);
    const byNumber = params[6] ? this.getParamFromValues(params[6]) : false;

    if (index === undefined || top === undefined) {
      throw rule.error(
        "Variables outside of loop scope are not available for looping"
      );
    }

    const direction = top < index ? -1 : 1;
    const by = (byNumber || 1) * direction;
    const limit = top * direction;

    for (let i = index; i * direction <= limit; i = i + by) {
      this.values.set(iterator, i);
      const content = rule.clone();

      if (this.hasNestedLoops(rule) && this.opts.nested) {
        (content.nodes as ChildNode[]).forEach((nestedRule) => {
          if (nestedRule.type === "atrule" && nestedRule.name === "for") {
            this.unrollChildLoop(nestedRule as AtRule, rule);
          }
        });
      }

      const newNodes = this.replaceVarsWithValues(content.nodes as Rule[]);
      this.appendClean(newNodes.filter((n) => n.type === "rule"));
      this.values.delete(iterator);
    }
    
    this.values.clear();
    rule.remove();
  }
}

const postCssForPlugin: PluginCreator<Partial<PluginOptions>> = (
  options?: Partial<PluginOptions>
) => new PostCssForPlugin(options);
postCssForPlugin.postcss = true;


export { postCssForPlugin };

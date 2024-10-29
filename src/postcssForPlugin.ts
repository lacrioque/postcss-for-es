import postcss, {
  type AtRule,
  type Plugin,
  type PluginCreator,
  type ChildNode,
  Rule
} from "postcss";
import list from "postcss/lib/list";
import vars from "postcss-simple-vars";

export interface PluginOptions {
  nested: boolean;
}

export class PostCssForPlugin implements Plugin {
  public postcssPlugin: string = "postcss-fores";

  private defaultOptions: PluginOptions = {
    nested: true
  };

  public opts: PluginOptions;

  private iterStack: string[] = [];

  constructor(options?: Partial<PluginOptions>) {
    this.opts = options
      ? { ...this.defaultOptions, ...options }
      : this.defaultOptions;
  }

  get iterStackLength() {
    return this.iterStack.length;
  }

  clearStack() {
    this.iterStack = [];
  }

  AtRule = {
    for: (rule: AtRule) => {
      if (rule.parent) {
        this.manageIterStack(rule);
      }
      this.unrollLoop(rule);
    }
  };

  manageRootIterStack(rule: AtRule): void {
    const parentIterVar =
      (rule.parent as AtRule)?.params &&
      list.space((rule.parent as AtRule)?.params)[0];
    if (this.iterStack.indexOf(parentIterVar) === -1) {
      this.clearStack();
      return;
    }
    // If parent is in stack, remove stack after parent
    this.iterStack.splice(
      this.iterStack.indexOf(parentIterVar) + 1,
      this.iterStackLength - this.iterStack.indexOf(parentIterVar) - 1
    );
    this.iterStack.push(list.space(rule.params)[0]);
  }

  manageIterStack(rule: AtRule): void {
    if (rule.parent?.type === "root") {
      return this.manageRootIterStack(rule);
    }

    this.clearStack();
    // Push current rule on stack regardless
    this.iterStack.push(list.space(rule.params)[0]);
  }

  parentsHaveIterator(rule: AtRule, param: string): boolean {
    if (
      rule.parent == null ||
      rule.parent.type === "root" ||
      !(rule.parent as AtRule)?.params
    ) {
      return false;
    }

    const parentIterVar = list.space((rule.parent as AtRule).params);

    if (parentIterVar[0] == null) {
      return false;
    }
    if (parentIterVar[0] === param || this.iterStack.indexOf(param) !== -1) {
      return true;
    }

    return this.parentsHaveIterator(rule.parent as AtRule, param);
  }

  checkNumber(rule: AtRule) {
    return (param: string) => {
      if (isNaN(parseInt(param)) || !param.match(/^-?\d+\.?\d*$/)) {
        if (param.indexOf("$") !== -1) {
          if (!this.parentsHaveIterator(rule, param)) {
            throw rule.error(
              "External variable (not from a parent for loop) cannot be used as a range parameter",
              { plugin: "postcss-for" }
            );
          }
        } else {
          throw rule.error("Range parameter should be a number", {
            plugin: "postcss-for"
          });
        }
      }
    };
  }

  checkParams(rule: AtRule, params: string[]) {
    if (
      !params[0].match(/(^|[^\w])\$([\w\d-_]+)/) ||
      params[1] !== "from" ||
      params[3] !== "to" ||
      (params[5] && params[5] !== "by")
    ) {
      throw rule.error("Wrong loop syntax", { plugin: "postcss-for" });
    }

    [params[2], params[4], params[6] || "0"].forEach(this.checkNumber(rule));
  }

  replaceVars(key: string, value: string | number, nodes: ChildNode[]): Rule[] {
    return nodes.map((node) => {
      if (node.type === "rule") {
        node.selector = node.selector.replace(`\$${key}`, `${value}`).trim();
        node.replaceValues(`\$(${key})`, `${value}`);
      }
      return node;
    }) as Rule[];
  }

  unrollLoop(rule: AtRule) {
    const params = list.space(rule.params);

    this.checkParams(rule, params);

    const iterator = params[0].slice(1);
    const index = +params[2];
    const top = +params[4];
    const dir = top < index ? -1 : 1;
    const by = (+params[6] || 1) * dir;

    const value: Record<string, number> = {};
    for (let i = index; i * dir <= top * dir; i = i + by) {
      const content = rule.clone();
      value[iterator] = i;
      if (content.nodes) {
        const newNodes = this.replaceVars(iterator, i, content.nodes);
        rule.parent?.insertBefore(rule, newNodes);
      }
    }
    if (rule.parent) rule.remove();
  }
}

const postCssForPlugin = (options?: Partial<PluginOptions>) =>
  new PostCssForPlugin(options);
postCssForPlugin.postcss = true;

export { postCssForPlugin };

export default postCssForPlugin as PluginCreator<PluginOptions>;

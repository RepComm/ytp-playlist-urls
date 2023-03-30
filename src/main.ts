
interface VideoInfo {
  rect: DOMRect;
  url: string;
}

interface QueryInfo {
  [key: string]: string|Array<string>;
}
interface URLInfo {
  base: string;
  query: string;
  queryParams: QueryInfo;
}

function decomposeUrl (urlStr: string, allowDuplicateParamKeys: boolean = true) {
  //split the base url from the query
  let [base, query] = urlStr.split("?");
  
  //create a result that we'll return later
  let result: URLInfo = {
    base,
    query,
    queryParams: {} //parsed version of query
  };
  
  //split each param
  let paramStrs = query.split("&");
  
  for (let paramStr of paramStrs) {
    let [key, value] = paramStr.split("=");
    
    let existingValue = result.queryParams[key];

    //if param used multiple times, handle edge case
    if (allowDuplicateParamKeys && existingValue !== undefined && existingValue !== null) {
      if (Array.isArray(existingValue)) {
        existingValue.push(value);
      } else {
        existingValue = [existingValue, value];
      }
    } else {
      result.queryParams[key] = value;
    }

  }

  return result;
}
function composeUrl (urlInfo: URLInfo, ...allowedKeys: string[]) {
  let result = urlInfo.base;

  let paramKeys = Object.keys(urlInfo.queryParams);

  let firstValueWritten = false;

  //loop over every param
  for (let i=0; i<paramKeys.length; i++) {

    let key = paramKeys[i];
    let value = urlInfo.queryParams[key];
    
    if (allowedKeys && allowedKeys.length > 0 && allowedKeys.includes(key)) {
      //ternary ops would have been beautifully terse, but alas it was complicated when param keys used multiple times :(
      if (Array.isArray(value)) {
        for (let j=0; j<value.length; j++) {
          let v = value[j];
          if (firstValueWritten) {
            result += `&${key}=${v}`;
          } else {
            firstValueWritten = true;
            result += `?${key}=${v}`;
          }
        }
      } else {
        if (firstValueWritten) {
          result += `&${key}=${value}`;
        } else {
          firstValueWritten = true;
          result += `?${key}=${value}`;
        }
      }
    }

  }
  return result;
}

async function main() {
  let ui = new UIBuilder();
  ui.default(exponent);

  console.log("YouTube Playlist - List Urls");
  console.log("Listing urls for", window.location.href);

  let header = document.getElementById("header-container") as HTMLDivElement;

  let localMenu = ui.create("div").id("ytp-menu").mount(header).e;

  let contents = document.getElementById("contents");
  ui.ref(contents).style({
    display: "flex",
    flexDirection: "row"
  });

  let playlistContainer = document.getElementsByTagName("ytd-playlist-video-renderer");

  const videoInfos = new Array<VideoInfo>();

  for (let i=0; i<playlistContainer.length; i++) {
    let video = playlistContainer[i];

    let link = video.querySelector("#video-title") as HTMLAnchorElement;

    //decompose link, no duplicate keys allowed
    let urlInfo = decomposeUrl(link.href, false);
    //recompose, but dont include query params if they aren't "v"
    let url = composeUrl(urlInfo, "v");


    if (link && link.href) {
      let info: VideoInfo = {
        rect: video.getBoundingClientRect(),
        url
      };
      videoInfos.push(info);
    }
    
  }

  let localContainer = ui.create("div").id("ytp-urls-container").style({
    fontSize: "large"
  }).mount(contents).e;

  let copyClipboardBtn = ui.create("button")
  .textContent("Copy")
  .id("ytp-urls-copy")
  .style({
    backgroundColor: "#5ba16157",
    width: "100%",
    display: "block",
    textAlign: "center",
    borderRadius: "0.5em",
    paddingTop: "0.5em",
    paddingBottom: "0.5em",
    cursor: "pointer",
  }).on("click", async (evt)=>{
    let text = list.innerText.trim();

    try {
      navigator.clipboard.writeText(text);
      copyClipboardBtn.textContent = "Copied :)";
    } catch (ex) {
      copyClipboardBtn.textContent = `Copy issue: ${ex}`;
    }
  }).mount(localMenu).e;

  let list = ui.create("table")
  .mount(localContainer)
  .id("ytp-urls-list")
  .style({
    borderStyle: "solid",
    borderWidth: "1px",
    borderRadius: "1em",
    borderColor: "gray",
    backgroundColor: "#aec6c933",
    fontSize: "medium"
  }).e;

  for (let i=0; i<videoInfos.length; i++) {
    let vi = videoInfos[i];
    
    let row = ui.create("tr").mount(list).e;
  
    let item = ui.create("td")
    .textContent(vi.url)
    .style({
      height: `${vi.rect.height}px`
    })
    .mount(row).e;
  }
}

function setTimeoutBoolean (cb: Function, checkCallback: ()=>boolean, checkInterval: number = 100) {
  let success = false;

  let check = setInterval(()=>{
    if (success) {
      clearInterval(check);
      return;
    }

    if (checkCallback()) {
      success = true;
      clearInterval(check);
      cb();
    }
  }, checkInterval);
}

setTimeoutBoolean(()=>{
  setTimeout(()=>{
    main();
  }, 500);
}, ()=>document.getElementById("contents") !== undefined);






// below is yoinked from @roguecircuitry/htmless


/**
 * Used to convert:
 * 
 * ```js
 * { backgroundColor: "white"}
 * ```
 * to
 * 
 * ```css
 * { background-color: "white"}
 * ```
 * 
 * @param v 
 * @returns 
 */
function cssConvertCase (v: string): string {
  let ch: string;
  let chl: string;

  let result = "";

  for (let i=0; i<v.length; i++) {
    ch = v.charAt(i);
    chl = ch.toLowerCase();

    if (ch !== chl) {
      result += "-" + chl;
    } else {
      result += ch;
    }
  }

  return result;
}

/**
 * 
 * @param s 
 * @returns 
 */
function cssDeclarationToString (s: Partial<CSSStyleDeclaration>): string {
  let result = "{";

  if (s !== undefined && s !== null) {
    let keys = Object.keys(s);
    let value: string;
  
    for (let key of keys) {
      value = s[key];
  
      key = cssConvertCase(key);
  
      result += `${key}:${value};`;
    }
  }
  result += "}\n";
  return result;
}

interface StyleKeyFrameDef {
  from: Partial<CSSStyleDeclaration>;
  to: Partial<CSSStyleDeclaration>;
  [key: string]: Partial<CSSStyleDeclaration>; //handles 0% , etc
}

interface StyleDef {
  [key: string]: Partial<CSSStyleDeclaration> | StyleKeyFrameDef;
}

interface DefaultCallback {
  (ui: UIBuilder<any>): void;
}

interface TagNameCSSClassMap {
  [key: string]: string[];
}

interface AttributeMap {
  [key: string]: string;
}

const ExponentCSSClassMap: TagNameCSSClassMap = {
  div: ["exponent", "exponent-div"],
  button: ["exponent", "exponent-button"],
  canvas: ["exponent", "exponent-canvas"],
  input: ["exponent", "exponent-input"],
  body: ["exponent", "body"]
};

function exponent(ui: UIBuilder<any>) {
  //get type of element
  let type = ui.e.tagName.toLowerCase();
  //get classes for the element
  let cs = ExponentCSSClassMap[type];
  if (!cs) return;
  //apply them
  ui.classes(...cs);
}

type InputType =
  "button" | "checkbox" | "color" |
  "date" | "datetime-local" |
  "email" | "file" | "hidden" |
  "image" | "month" | "number" |
  "password" | "radio" | "range" |
  "reset" | "search" | "submit" |
  "tel" | "text" | "time" |
  "url" | "week";

interface DOMRectLike {
  x: number;
  y: number;
  width: number;
  height: number;
}

type EvtListenerOptions = boolean | AddEventListenerOptions;

class UIBuilder<T extends HTMLElement> {
  /**the document being used for creating elements*/
  _doc: Document;

  /**a list of elements being created*/
  elements: Array<HTMLElement>;

  defaultCallbacks: Set<DefaultCallback>;

  default(cb: DefaultCallback): this {
    this.defaultCallbacks.add(cb);
    return this;
  }
  defaultOff(cb: DefaultCallback): this {
    this.defaultCallbacks.delete(cb);
    return this;
  }

  /**the current element being created*/
  get e(): T {
    return this.elements[this.elements.length - 1] as any;
  }

  /**Create a UI builder
   * optionally provide the document used to create elements, default is window.document
   * @param d 
   */
  constructor(d: Document = window.document) {
    this.elements = new Array();

    this.defaultCallbacks = new Set();

    this.doc(d);

    //BUILT-IN

    this
      .create("style", "exponent-styles")
      .style({
        "body": {
          top: "0",
          left: "0",
          width: "100vw",
          height: "100vh",
          margin: "0",
          padding: "0",
          overflow: "hidden",
          display: "flex"
        },
        ".exponent": {
          flex: "1",
          color: "inherit"
        },
        ".exponent-div": {
          display: "flex"
        },
        ".exponent-button": {
          border: "none",
          cursor: "pointer"
        },
        ".exponent-canvas": {
          minWidth: "0"
        },
        ".exponent-input": {
          minWidth: "0",
          minHeight: "0"
        }
      })
      .mount(this._doc.head);
  }

  /**set the document used to create elements*/
  doc(d: Document): this {
    this._doc = d;
    return this;
  }

  /**document.create, but less wordy, and you can provide an ID*/
  create<K extends keyof HTMLElementTagNameMap>(type: K, id?: string, ...classNames: string[]): UIBuilder<HTMLElementTagNameMap[K]> {
    let e = this._doc.createElement(type);

    let ne = window.document.createElement("div")
    if (id) e.id = id;
    this.elements.push(e);
    if (classNames) this.classes(...classNames);

    if (this.defaultCallbacks) {
      for (let cb of this.defaultCallbacks) {
        cb(this);
      }
    }

    return this as any;
  }

  /**
   * Set the input type and value
   * Does nothing if current element is not an input 
   */
  input(type: InputType, value?: string): this {
    if (this.e! instanceof HTMLInputElement) return this;
    let inp = (this.e as any);
    inp.type = type;
    inp.value = value;
    return this;
  }

  /**
   * Set the individual styling for an element
   * 
   * Or if the element is a <style> tag, sets its textContent
   * 
   * Example:
   * 
   * ```ts
   * .create("style")
   * .style({
   *   ".bg": {
   *     backgroundColor: "gray",
   *   }
   * })
   * .mount(document.head)
   * 
   * //or for a non-style element:
   * 
   * .create("div", "content")
   * .style({
   *   color: "white",
   *   height: "100px"
   * })
   * .mount(document.body)
   * ```
   */
  style(s: Partial<CSSStyleDeclaration> | StyleDef): this {
    if (this.e instanceof HTMLStyleElement) {
      //get style ids list
      let keys = Object.keys(s);

      //individual styling for an item
      let ss: Partial<CSSStyleDeclaration>;

      //converted to a string
      let sss: string;

      //loop thru each style id
      for (let key of keys) {
        //handle special case for keyframes
        if (key.startsWith("@keyframes")) {

          let keyframeDef = s[key] as StyleKeyFrameDef;

          let keyframes = Object.keys(keyframeDef);
          let output = `${key} {`;
          for (let kf of keyframes) {
            let kfCSS = keyframeDef[kf];

            output += `${kf} ${cssDeclarationToString(kfCSS)} `;
          }
          output += "}";
          this.e.textContent += output;
          // let from = keyframeDef.from;
          // let to = keyframeDef.to;

          // this.e.textContent += `${key} { from ${cssDeclarationToString( from )} to ${cssDeclarationToString( to )} }`;

        } else {

          //get the styling content for it
          ss = s[key];
          //conver to string
          sss = cssDeclarationToString(ss);

          //append to style textContent
          this.e.textContent += `${key} ${sss}`;
        }

      }
    } else {
      Object.assign(this.e.style, s);
    }
    return this;
  }
  /**add CSS classes*/
  classes(...classes: string[]): this {
    this.e.classList.add(...classes);
    return this;
  }
  hasClass(c: string): boolean {
    return this.e.classList.contains(c);
  }
  /**remove CSS classes*/
  classesRemove(...classes: string[]): this {
    this.e.classList.remove(...classes);
    return this;
  }
  /**set the ID*/
  id(id: string): this {
    this.e.id = id;
    return this;
  }
  /**set the textContent*/
  textContent(s: string): this {
    this.e.textContent = s;
    return this;
  }
  /**assign attributes*/
  attrs(attrs: AttributeMap): this {
    let keys = Object.keys(attrs);

    for (let key of keys) {
      let value = attrs[key];

      this.e.setAttribute(key, value);
    }
    Object.assign(this.e.attributes, attrs);
    return this;
  }
  hasAttr(attrName: string): boolean {
    return this.e.hasAttribute(attrName);
  }
  removeAttr(attrName: string): this {
    this.e.removeAttribute(attrName);
    return this;
  }
  /**console.log(element, ...msgs)*/
  log(...msgs: string[]): this {
    console.log(this.e, ...msgs);
    return this;
  }
  /**Append as a child to `p`
   * Where p is an HTMLElement or an index into previous created elements
   */
  mount(p?: HTMLElement | number): this {
    if (p && p instanceof HTMLElement) {
      p.appendChild(this.e);
    } else {
      p = this.elements[this.elements.length - (p as number + 1)];
      if (!p) p = this._doc.body;
      p.appendChild(this.e);
    }
    return this;
  }
  /**Remove from a parent element
   * 
   * If `p` is provided, will do nothing if p is not the parent
   * If no parent element exists, will do nothing
   * @param p 
   * @returns 
   */
  unmount(p?: HTMLElement): this {
    //do nothing if there is already no parent
    if (!this.e.parentElement) return this;
    //do nothing if parent element doesn't match a provided parent selector
    if (p && this.e.parentElement !== p) return this;

    //otherwise remove from parent
    this.e.remove();
    return this;
  }
  /**Alias to `<HTMLElement>.addEventListener`*/
  on<K extends keyof HTMLElementEventMap>(
    type: K,
    listener: (
      this: HTMLElement,
      ev: HTMLElementEventMap[K]
    ) => any,
    options?: EvtListenerOptions): this {
    this.e.addEventListener(type, listener, options);
    return this;
  }
  ref(e: HTMLElement): this {
    this.elements.push(e);
    return this;
  }
  deref(): this {
    this.elements.pop();
    return this;
  }
  /**Alias to `<HTMLElement>.removeEventListener`*/
  off(
    type: keyof HTMLElementEventMap,
    listener: (this: HTMLElement, ev: Event) => any
  ): this {
    this.e.removeEventListener(type, listener);
    return this;
  }
  /**Alias to `<HTMLElement>.getBoundingClientRect`*/
  getRect(): DOMRect {
    return this.e.getBoundingClientRect();
  }
  /**Same as getRect, but output is saved to a provided `out: DOMRectLike`, this method is still chainable*/
  rect(out: DOMRectLike): this {
    Object.assign(out, this.getRect());
    return this;
  }
}
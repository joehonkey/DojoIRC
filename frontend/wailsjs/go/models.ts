export namespace config {
	
	export class SASL {
	    Mechanism: string;
	    Username: string;
	    Password: string;
	
	    static createFrom(source: any = {}) {
	        return new SASL(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.Mechanism = source["Mechanism"];
	        this.Username = source["Username"];
	        this.Password = source["Password"];
	    }
	}
	export class Server {
	    Name: string;
	    Host: string;
	    Port: number;
	    TLS: boolean;
	    Nick: string;
	    AltNick: string;
	    Ident: string;
	    RealName: string;
	    Channels: string[];
	    NickServPass: string;
	    Password: string;
	    SASL?: SASL;
	    Ignore: string[];
	
	    static createFrom(source: any = {}) {
	        return new Server(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.Name = source["Name"];
	        this.Host = source["Host"];
	        this.Port = source["Port"];
	        this.TLS = source["TLS"];
	        this.Nick = source["Nick"];
	        this.AltNick = source["AltNick"];
	        this.Ident = source["Ident"];
	        this.RealName = source["RealName"];
	        this.Channels = source["Channels"];
	        this.NickServPass = source["NickServPass"];
	        this.Password = source["Password"];
	        this.SASL = this.convertValues(source["SASL"], SASL);
	        this.Ignore = source["Ignore"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}

}

export namespace main {
	
	export class UIConfig {
	    theme_name: string;
	    theme: theme.Colors;
	    font: string;
	    font_size: number;
	
	    static createFrom(source: any = {}) {
	        return new UIConfig(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.theme_name = source["theme_name"];
	        this.theme = this.convertValues(source["theme"], theme.Colors);
	        this.font = source["font"];
	        this.font_size = source["font_size"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}

}

export namespace preview {
	
	export class Result {
	    url: string;
	    title: string;
	    description: string;
	    image: string;
	    domain: string;
	    isImage: boolean;
	
	    static createFrom(source: any = {}) {
	        return new Result(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.url = source["url"];
	        this.title = source["title"];
	        this.description = source["description"];
	        this.image = source["image"];
	        this.domain = source["domain"];
	        this.isImage = source["isImage"];
	    }
	}

}

export namespace theme {
	
	export class Buffer {
	    background: string;
	    timestamp: string;
	    server_line: string;
	    action: string;
	    nick_self: string;
	
	    static createFrom(source: any = {}) {
	        return new Buffer(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.background = source["background"];
	        this.timestamp = source["timestamp"];
	        this.server_line = source["server_line"];
	        this.action = source["action"];
	        this.nick_self = source["nick_self"];
	    }
	}
	export class Input {
	    background: string;
	    text: string;
	    placeholder: string;
	    nick_color: string;
	
	    static createFrom(source: any = {}) {
	        return new Input(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.background = source["background"];
	        this.text = source["text"];
	        this.placeholder = source["placeholder"];
	        this.nick_color = source["nick_color"];
	    }
	}
	export class Nicklist {
	    background: string;
	    text: string;
	    op: string;
	    halfop: string;
	    voice: string;
	    away: string;
	
	    static createFrom(source: any = {}) {
	        return new Nicklist(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.background = source["background"];
	        this.text = source["text"];
	        this.op = source["op"];
	        this.halfop = source["halfop"];
	        this.voice = source["voice"];
	        this.away = source["away"];
	    }
	}
	export class Highlights {
	    mention_bg: string;
	    mention_text: string;
	    keyword: string;
	
	    static createFrom(source: any = {}) {
	        return new Highlights(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.mention_bg = source["mention_bg"];
	        this.mention_text = source["mention_text"];
	        this.keyword = source["keyword"];
	    }
	}
	export class Sidebar {
	    background: string;
	    text: string;
	    active: string;
	    unread: string;
	    mention: string;
	    server: string;
	
	    static createFrom(source: any = {}) {
	        return new Sidebar(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.background = source["background"];
	        this.text = source["text"];
	        this.active = source["active"];
	        this.unread = source["unread"];
	        this.mention = source["mention"];
	        this.server = source["server"];
	    }
	}
	export class General {
	    background: string;
	    text: string;
	    border: string;
	    accent: string;
	
	    static createFrom(source: any = {}) {
	        return new General(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.background = source["background"];
	        this.text = source["text"];
	        this.border = source["border"];
	        this.accent = source["accent"];
	    }
	}
	export class Colors {
	    general: General;
	    sidebar: Sidebar;
	    buffer: Buffer;
	    highlights: Highlights;
	    nicklist: Nicklist;
	    input: Input;
	
	    static createFrom(source: any = {}) {
	        return new Colors(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.general = this.convertValues(source["general"], General);
	        this.sidebar = this.convertValues(source["sidebar"], Sidebar);
	        this.buffer = this.convertValues(source["buffer"], Buffer);
	        this.highlights = this.convertValues(source["highlights"], Highlights);
	        this.nicklist = this.convertValues(source["nicklist"], Nicklist);
	        this.input = this.convertValues(source["input"], Input);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	
	
	
	

}


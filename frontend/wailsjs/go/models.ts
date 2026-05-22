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


import asn1 from 'asn1.js';
import sha256 from 'crypto-js/sha256';
import * as base32 from 'hi-base32';
import elliptic from 'elliptic';

interface ICurve {
  curveCode: string;
  value: string;
}

export default class PCF  {
    private githubTree = "https://api.github.com/repos/Path-Check/paper-cred/git/trees"

    private localPubKeyDB: {[key: string]: any} = {}
    private localPayloadsDB: string[] = []
    private localPayloadsSpecFiles = []

    // PEM Definitions
    private ECPublicKey = asn1.define("PublicKey", function() {
        // @ts-ignore
        this.seq().obj(
            // @ts-ignore
            this.key("algorithm").seq().obj(
                // @ts-ignore
                this.key("id").objid(),
                // @ts-ignore
                this.key("curve").objid()
            ),
            // @ts-ignore
            this.key("pub").bitstr()
        );
    })

    private ECPrivateKey = asn1.define("ECPrivateKey", function() {
        // @ts-ignore
        this.seq().obj(
            // @ts-ignore
            this.key('version').int().def(1),
            // @ts-ignore
            this.key('privateKey').octstr(),
            // @ts-ignore
            this.key('parameters').explicit(0).objid().optional(),
            // @ts-ignore
            this.key('publicKey').explicit(1).bitstr().optional()
        );
    })

    private algos = {'1.2.840.10045.2.1':'Elliptic curve public key cryptography'}
//    private curves: ICurve = {curveCode: '1.3.132.0.10', value: 'secp256k1'}
    private curves: {[key: string]: any} = {'1.3.132.0.10': 'secp256k1'}
    

    private buildPayload = function(valueArray: []) {
        const fields = valueArray.map(function(elem: string) {
            return encodeURIComponent(elem.toUpperCase());
        })
        return fields.join('/');
    }

    public parsePayload(payload: string) {
        const encodedFields = payload.split("/");
        const decodedFields = encodedFields.map(function(field) {
            return decodeURIComponent(field);
        })
        return decodedFields;
    }

    buildHashPayload = function (elemArray: []) {
        const RS = String.fromCharCode(30);
        const fields = elemArray.map(function(elem: string) {
            return elem.toUpperCase();
        })
        return fields.join(RS);
    }

    private getPayloadHash = (fields: []) => {
      const hashedPassKey = this.buildHashPayload(fields);
      const digest = sha256(hashedPassKey).toString();
      const hashPassKeyBase32 = this.rmPad(base32.encode(digest));
      return hashPassKeyBase32;
    }

    private pad = function (base32Str: string) {
        switch (base32Str.length % 8) {
            case 2: return base32Str + "======"; 
            case 4: return base32Str + "===="; 
            case 5: return base32Str + "==="; 
            case 7: return base32Str + "="; 
        }
        return base32Str;
    }

    private rmPad = function(base32Str: string) {
        return base32Str.replaceAll("=", "");
    }

    private verify(pubkey: string, payload: string, signatureBase32NoPad: string): boolean {
        // Decoding the public key to get curve algorithm + key itself
        const pubk = this.ECPublicKey.decode(pubkey, 'pem', {label: 'PUBLIC KEY'});

        // Get Encryption Algorithm: EC
        const algoCode = pubk.algorithm.id.join('.');
        // Get Curve Algorithm: secp256k1
        const curveCode = pubk.algorithm.curve.join('.');
        
        // Prepare EC with assigned curve
        const ec = new elliptic.ec(this.curves[curveCode]);
        
        // Load public key from PEM as DER
        const key = ec.keyFromPublic(pubk.pub.data, 'der');

        // Converts to UTF-8 -> WorldArray -> SHA256 Hash 
        const payloadSHA256 = sha256(payload).toString();

        // Gets the Base32 enconded, add padding and convert to DER.
        const signatureDER = base32.decode.asBytes(this.pad(signatureBase32NoPad));

        // Verifies Signature. 
        return key.verify(payloadSHA256, signatureDER);
    }

    private sign = (type: string, version: string, priKeyPEM: string, pubKeyLink: string, payloadValueArray: []) => {
        // Load Primary Key
        const ec_pk = this.ECPrivateKey.decode(priKeyPEM, 'pem', {label: 'EC PRIVATE KEY'});
        
        // Get Curve Algorithm.
        const curveCode = ec_pk.parameters.join('.');
        
        // Prepare EC with assigned curve: secp256k1
        const ec = new elliptic.ec(this.curves[curveCode]);

        // Load Private Key from PEM file converted to DER.
        const key = ec.keyFromPrivate(ec_pk.privateKey, 'der');

        // Assemble Payload
        const payload = this.buildPayload(payloadValueArray);

        // Converts to UTF-8 -> WorldArray -> SHA256 Hash 
        const payloadSHA256 = sha256(payload).toString();
        
        // Signs, gets a DER
        const signatureDER = key.sign(payloadSHA256).toDER();

        // Converts DER to Base32 and remove padding. 
        const signature = this.rmPad(base32.encode(signatureDER));

        return this.formatURI(type, version, signature, pubKeyLink, payload);
    }

    public parseURI = function(uri: string): string[] {
        return uri.split(':');
    }

    private formatURI = function(type: string, version: string, signature: string, pubKeyLink: string, payload: string) {
      return ["CRED", type.toUpperCase(), version.toUpperCase(), signature, pubKeyLink.toUpperCase(), payload].join(":");
    }

    private getPayloadTypes = (): string[] => {
        if (this.localPayloadsDB.length > 0) return this.localPayloadsDB;

        try {
            const filesRoot = this.getJSON("https://api.github.com/repos/Path-Check/paper-cred/git/trees/main").tree
            const payloadsDir = filesRoot.find((element: any) => element.path === 'payloads');

            const filesPayloads = this.getJSON("https://api.github.com/repos/Path-Check/paper-cred/git/trees/"+payloadsDir.sha).tree;

            this.localPayloadsSpecFiles = filesPayloads.filter((x:any) => x.path.includes(".fields") )
            this.localPayloadsDB = this.localPayloadsSpecFiles.map((x:any) => x.path.replaceAll(".fields","") );

            return this.localPayloadsDB;
        } catch(err) {
            console.error(err);
        }
        return this.localPayloadsDB;
    }

    private payloadTypeExist = (type: string, version: string) => {
      return this.getPayloadTypes().includes(type.toLowerCase()+"."+version);
    }

    private getPayloadHeader = (type: string, version: string): string[] => {
        if (!this.payloadTypeExist(type, version)) return [];

        const headerFile: any = this.localPayloadsSpecFiles.find((element: any) => element.path === type.toLowerCase()+"."+version+'.fields');
        if (!headerFile) return [];
        try {
            return atob(this.getJSON(headerFile.url).content).split("/");
        } catch(err) {
            console.error(err);
            return [];
        }
    }

    private getTXT = function(url: string) {
        const client = new XMLHttpRequest();
        client.open('GET', url, false);
        client.setRequestHeader("Accept", "application/vnd.github.v3+json");
        client.send();
        return client.response;
    }

    private getJSON = (url: string) => {
        return JSON.parse(this.getTXT(url));
    }

    private getGitHubDatabase = (id: string, database: string) => {
        try {
            const rootDir = this.getJSON(this.githubTree + "/" + "main").tree
            const databasesDir = rootDir.find((element:any) => element.path === 'keys');

            if (databasesDir === undefined) {
                console.debug("Keys Directory not Found on GitHub");
                return;
            }

            const databases = this.getJSON(this.githubTree+"/"+databasesDir.sha).tree
            const databaseDir = databases.find((element: any) => element.path === database);

            if (databaseDir === undefined) {
                console.debug("Database not found on GitHub " + database);
                return;
            } 
            
            const idsFiles = this.getJSON(this.githubTree+"/"+databaseDir.sha).tree
            const idFile = idsFiles.find((element: any) => element.path === id+'.pem');

            if (idFile === undefined) {
                console.debug("Id not found on GitHub " + id);
                return;
            }

            const publicKeyPem = atob(this.getJSON(idFile.url).content)

            return publicKeyPem;
        } catch(err) {
            console.error(err);
        }
    }

    public getKeyId = (pubkeyLink: string) => {
        // Download pubkey to verify
        if (this.localPubKeyDB[pubkeyLink]) {
            return this.localPubKeyDB[pubkeyLink];
        }
            
        try {
            // Try to download from the DNS TXT record. 
            const jsonResponse = this.getJSON("https://dns.google/resolve?name=" + pubkeyLink + '&type=TXT');
            if (jsonResponse.Answer) {
                const pubKeyTxtLookup = jsonResponse.Answer[0].data
                let noQuotes = pubKeyTxtLookup.substring(1, pubKeyTxtLookup.length - 1).replaceAll("\\n","\n");
                    
                if (noQuotes) {  
                    if (!noQuotes.includes("-----BEGIN PUBLIC KEY-----")) {
                        noQuotes = "-----BEGIN PUBLIC KEY-----" + "\n" + noQuotes + "\n" + "-----END PUBLIC KEY-----\n"
                    } 

                    this.localPubKeyDB[pubkeyLink] = { type: "DNS", key: noQuotes, debugPath: "https://dns.google/resolve?name=" + pubkeyLink + '&type=TXT'};
                    return this.localPubKeyDB[pubkeyLink];
                }
            }
        } catch(err) {
            console.error(err);
        }    

        try {
            // Try to download as a file. 
            const txtResponse = this.getTXT("https://" + pubkeyLink);

            if (txtResponse.includes("-----BEGIN PUBLIC KEY-----")) { 
                this.localPubKeyDB[pubkeyLink] = { type: "URL", key: txtResponse, debugPath: "https://" + pubkeyLink };
                return this.localPubKeyDB[pubkeyLink];
            }
        } catch(err) {
            console.error(err);
        }

        try {   
            const id = pubkeyLink.split('.')[0];
            const group = pubkeyLink.split('.')[1];
            const publicKey = this.getGitHubDatabase(id, group);
            if (publicKey != undefined && publicKey.includes("-----BEGIN PUBLIC KEY-----")) { 
                this.localPubKeyDB[pubkeyLink] = { type: "GITDB", key: publicKey, debugPath: "https://github.com/Path-Check/paper-cred/tree/main/keys/" + group + "/" + id + ".pem" };
                return this.localPubKeyDB[pubkeyLink];
            } else {
                console.error("GitHub Not Found: "+ publicKey);
            }
        } catch(err) {
            console.error(err);
        }

        return null;
    }   

    private debugPayloadURL = (type: string, version: string) => {
       const rightCaseVersion = this.getPayloadTypes().find((element: any)  => element.toUpperCase().includes(type.toUpperCase()+"."+version));
       return "https://github.com/Path-Check/paper-cred/blob/main/payloads/"+rightCaseVersion+".md";
    }

    private debugParseURI = (uri: string) => {
        try {
          const [schema, type, version, signatureBase32NoPad, pubKeyLink, payload] = this.parseURI(uri);
          const decodedFields = this.parsePayload(payload);

          const keyID = this.getKeyId(pubKeyLink)

          // Updates screen elements. 
          let formattedResult = "Type: <span class='protocol'>" + type + ":" + version +
                                          " (<a href='" + this.debugPayloadURL(type, version) + "'>spec</a>)" +
                                      "</span><br>" + 
                                "Signature: <span class='signature'>" + signatureBase32NoPad.substr(0,10) + ".." + signatureBase32NoPad.substr(signatureBase32NoPad.length-10,10) + "</span>" + "<br>" +
                                "Public Key: <span class='pub-key'>" + pubKeyLink + "</span>" +
                                     " (<a href='" + keyID.debugPath + "'>"+keyID.type+"</a>)" + "<br>" +
                                "Fields: <br>";

          const headers: string[] = this.getPayloadHeader(type, version);  

          // Decodes all fields
          decodedFields.forEach(function(field: string, index: number) {
              formattedResult += "  "+headers[index].replace(/^\w/, (c: string) => c.toUpperCase())+": <span class='message'>" + field + "</span><br>" 
          });

          return formattedResult;
        } catch (err) {
          console.error(err);
          return "";
        }
    }

    public getPayloadFields = (payload: string, type: string, version: string): {[key: string]: any} => {
        const decodedFields = this.parsePayload(payload);
        const headers = this.getPayloadHeader(type, version);  

        const fields: {[key: string]: any} = {}
        decodedFields.forEach(function(field: string, index: number) {
            fields[headers[index]] = field;
        });
        return fields;
    }

    public downloadKeyVerify = (pubkeyLink: string, payload: string, signatureBase32NoPad: string): boolean => {
      const keyID = this.getKeyId(pubkeyLink);
      if (keyID !== null) {
          const publicKeyPEM = this.getKeyId(pubkeyLink).key;
          try{
              const verified = this.verify(publicKeyPEM, payload, signatureBase32NoPad);
              return verified;
          } catch(err) {
              console.error(err);
              return false;
          }
      } else {
          return false;
      }
    }

   private parseDownloadKeyVerify = (uri: string) => {
        const [schema, type, version, signatureBase32NoPad, pubKeyLink, payload] = this.parseURI(uri);  
        return this.downloadKeyVerify(pubKeyLink, payload, signatureBase32NoPad);
    }

    private debugDownloadVerify = (pubkeyLink: string, payload: string, signatureBase32NoPad: string) => {
      const keyID = this.getKeyId(pubkeyLink);
      if (keyID !== null) {
        const publicKeyPEM = this.getKeyId(pubkeyLink).key;
          try{
            const verified = this.verify(publicKeyPEM, payload, signatureBase32NoPad);
              return "Signature: " + (verified ? "Verified" : "Not Valid");
          } catch(err) {
              return "Signature Verification Failed: " + err;
              console.error(err);
          }
      } else {
          return "Verification Failed: Public Key not found.";
      }
    }

    private debugVerify=  (uri: string) => {
        let formattedMessages = "";
        
        if (uri === "") {
            formattedMessages += "Field is empty. It's not a valid URI.<br>";
            return;
        }

        try {
            this.parseURI(uri);
            formattedMessages += "QR was parsed sucessfully!<br><br>";
        } catch (err) {
            formattedMessages += "Could not parse string into the URI format.<br>";
            return formattedMessages;
        }                

        const [schema, type, version, signatureBase32NoPad, pubKeyLink, payload] = this.parseURI(uri);

        if (schema !== "CRED") {
            formattedMessages += "QR is not a credential: Code must start with CRED instead of "+schema +".<br>";
            return formattedMessages;
        }

        if (!this.payloadTypeExist(type, version)) {
            formattedMessages += "Type or version <b>" + type + ":" + version + "</b> was not recognized. Make sure this payload type and version are available on <a href='https://github.com/Path-Check/paper-cred/tree/main/payloads'>GitHub</a> <br><br>";
        }

        if (formattedMessages.includes("QR was parsed sucessfully!")) {
            formattedMessages += this.debugDownloadVerify(pubKeyLink, payload, signatureBase32NoPad);
        } else {
            formattedMessages += "<br>Signature: not verified";
        }

        return formattedMessages;
    }

}

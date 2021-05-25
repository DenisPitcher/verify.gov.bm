import asn1 from 'asn1.js';
import sha256 from 'crypto-js/sha256';
import * as base32 from 'hi-base32';
import elliptic from 'elliptic';
import publicKey from '../publicKey.json';

interface ICurve {
  curveCode: string;
  value: string;
}

export default class PCF  {
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

    private algos = {'1.2.840.10045.2.1':'Elliptic curve public key cryptography'}
    private curves: {[key: string]: any} = {'1.3.132.0.10': 'secp256k1'}

    public parsePayload(payload: string) {
        const encodedFields = payload.split("/");
        const decodedFields = encodedFields.map(function(field) {
            return decodeURIComponent(field);
        })
        return decodedFields;
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

    public verify(payload: string, signatureBase32NoPad: string): boolean {
        // Decoding the public key to get curve algorithm + key itself
        const pubk = this.ECPublicKey.decode(publicKey.key, 'pem', {label: 'PUBLIC KEY'});

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

    public parseURI = function(uri: string): string[] {
        return uri.split(':');
    }
}

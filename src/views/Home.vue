<template>
  <v-container>
    <div class="verify">
      <template v-if="typeVersion == ''">
        <br/>
        <p class="text-center">Use your camera to scan and verify the QR Code</p>
        <qrcode-stream @decode="onDecode" @init="onInit"></qrcode-stream>
      </template>
      <v-card 
        v-if="typeVersion != ''"
        >
        <template 
          v-if="result == true"
          class="justify-center">
          <v-list-item two-line>
            <v-list-item-content>
              <v-list-item-title class="text-h6 mb-1">
                {{ verifyVersion }}
              </v-list-item-title>
              <v-list-item-subtitle class="text-subtitle-1 mb-1">
                VERIFIED
              </v-list-item-subtitle>
            </v-list-item-content>
            <v-list-item-avatar
              tile
              height="90"
              width="75"
            >
              <v-icon
                color="green"
                size="6rem"
                class="float-left"
              >
                mdi-shield-check
              </v-icon>
            </v-list-item-avatar>
          </v-list-item>
        </template>
        <template 
          v-if="result == false"
          class="justify-center"
        >
          <v-card-title>
            <v-icon
              color="red"
              size="7rem"
            >
              mdi-shield-remove
            </v-icon>
            NOT VALID
          </v-card-title>
        </template>
        <v-divider></v-divider>
        <v-card-text v-if="typeVersion == 'BM.KEY.1'">
          <p><b>Initials:</b> {{ pass.Initials }}</p>
          <p><b>Birth Day:</b> {{ pass.BirthMonthDay }}</p>
          <p><b>Expiry Date:</b> {{ pass.ExpiryDate  | moment("dddd, MMMM Do YYYY") }}</p>
        </v-card-text>
        <v-card-text v-if="typeVersion == 'BM.VAX.1'">
          <p><b>LastName:</b> {{ vax.LastName }}</p>
          <p><b>FirstName:</b> {{ vax.FirstName }}</p>
          <p><b>Gender:</b> {{ vax.Gender }}</p>
          <p><b>Confirmation Id:</b> {{ vax.ReservationId }}</p>
          <p><b>Dose 1 Manufacturer:</b> {{ vax.Doses[0].Manufacturer }}</p>
          <p><b>Dose 1 LotNumber:</b> {{ vax.Doses[0].LotNumber }}</p>
          <p><b>Dose 1 Date:</b> {{ vax.Doses[0].Date | moment("dddd, MMMM Do YYYY") }}</p>
          <p><b>Dose 2 Manufacturer:</b> {{ vax.Doses[1].Manufacturer }}</p>
          <p><b>Dose 2 LotNumber:</b> {{ vax.Doses[1].LotNumber }}</p>
          <p><b>Dose 2 Date:</b> {{ vax.Doses[1].Date | moment("dddd, MMMM Do YYYY") }}</p>
        </v-card-text>
        <v-card-text v-if="typeVersion == 'BM.PCR.1'">
          <p><b>LastName:</b> {{ pcr.LastName }}</p>
          <p><b>FirstName:</b> {{ pcr.FirstName }}</p>
          <p><b>MiddleName:</b> {{ pcr.MiddleName }}</p>
          <p><b>Gender:</b> {{ pcr.Gender }}</p>
          <p><b>Unique Id:</b> {{ pcr.UniqueId }}</p>
          <p><b>Confirmation Number:</b> {{ pcr.ConfirmationNumber }}</p>
          <p><b>Sample Received Date:</b> {{ pcr.SampleReceivedDate | moment("dddd, MMMM Do YYYY") }}</p>
          <p><b>Result Received Date:</b> {{ pcr.ResultReceivedDate | moment("dddd, MMMM Do YYYY") }}</p>
          <p><b>Test Type:</b> {{ pcr.TestType }}</p>
          <p><b>Result:</b> {{ pcr.Result }}</p>
        </v-card-text>
        <v-card-actions>
          <v-btn 
            class="ma-2"
            color="cyan"
            @click="typeVersion = ''"
            >
            Verify Another
          </v-btn>
        </v-card-actions>
      </v-card>
      <p class="error">{{ error }}</p>
      <!-- <p class="decode-result">Last result: <b>{{ result }}</b></p> -->
    </div>
  </v-container>
</template>
<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import { QrcodeStream, QrcodeDropZone, QrcodeCapture } from 'vue-qrcode-reader';
import Vuetify from 'vuetify/lib'

import PCF from '@/components/PCF';
import SafeKey from '@/models/SafeKey';
import VaccinationCertificate from '@/models/VaccinationCertificate';
import VaccinationDose from '@/models/VaccinationDose';
import PCRTestCertificate from '@/models/PCRTestCertificate';


@Component({
  components: {
    QrcodeStream,
    QrcodeDropZone,
    QrcodeCapture,
  },
})
export default class Home extends Vue {
  private error = "";
  private result = false;
  private typeVersion = "";
  private verifyVersion = "";
  private pass: SafeKey = new SafeKey();
  private vax: VaccinationCertificate = new VaccinationCertificate();
  private pcr: PCRTestCertificate = new PCRTestCertificate();
  private pcf = new PCF();

  constructor() {
    super()
    this.pcf.getKeyId("KEYS.GOV.BM"); // preload key
  }

  public onDecode(result: string): void {
    if (result !== "" && result != null) {
        let uri = result.substring(result.indexOf("CRED:"));
        //e("qr-verify").value = uri;
        this.verifyQRCode(result);
    }
  }
  public async onInit (promise: any): Promise<any> {
      try {
        await promise
      } catch (error) {
        if (error.name === 'NotAllowedError') {
          this.error = "ERROR: you need to grant camera access permisson"
        } else if (error.name === 'NotFoundError') {
          this.error = "ERROR: no camera on this device"
        } else if (error.name === 'NotSupportedError') {
          this.error = "ERROR: secure context required (HTTPS, localhost)"
        } else if (error.name === 'NotReadableError') {
          this.error = "ERROR: is the camera already in use?"
        } else if (error.name === 'OverconstrainedError') {
          this.error = "ERROR: installed cameras are not suitable"
        } else if (error.name === 'StreamApiNotSupportedError') {
          this.error = "ERROR: Stream API is not supported in this browser"
        }
      }
  }
  public verifyQRCode(data: any): void {
    
      // if (!data)
      //     data = e("qr-verify").value;

      if (data !== "" && data != null && typeof(data) === 'string' && data.startsWith("CRED:")) {
          let uri = data.substring(data.indexOf("CRED:"));
      
          const [schema, type, version, signatureBase32NoPad, pubKeyLink, payload] = this.pcf.parseURI(uri); 

          if (pubKeyLink === "KEYS.GOV.BM" || process.env.NODE_ENV === 'development')
          {
            this.result = this.pcf.downloadKeyVerify(pubKeyLink, payload, signatureBase32NoPad);    
          }
          else{
            console.log('Environment: ' + process.env.NODE_ENV + ', pubKeyLink: ' + pubKeyLink + ' not supported');
            this.result = false;
          }
          
          const fields = this.pcf.parsePayload(payload);
          this.typeVersion = type + '.' + version;

          var year;
          var month;
          var day;
          switch(this.typeVersion){
            case 'BM.KEY.1': {
              this.verifyVersion = 'SAFE KEY'
              year = parseInt(fields[0].substring(0,4));
              month = parseInt(fields[0].substring(4,6));
              day = parseInt(fields[0].substring(6,8));
              this.pass.ExpiryDate = new Date(year, month-1, day);
              this.pass.Initials = fields[1];
              this.pass.BirthMonthDay = fields[2];
              if (this.pass.ExpiryDate < new Date())
              {
                this.result = false;
              }
              break;
            }
            case 'BM.VAX.1': {
              this.verifyVersion = 'VACCINATION CERTIFICATE'
              this.vax.LastName = fields[0];
              this.vax.FirstName = fields[1];
              year = parseInt(fields[2].substring(0,4));
              month = parseInt(fields[2].substring(4,6));
              day = parseInt(fields[2].substring(6,8));
              this.vax.DateOfBirth = new Date(year, month-1, day);
              this.vax.Gender = fields[3];
              this.vax.ReservationId = parseInt(fields[4]);
              var doses: VaccinationDose[] = [];
              year = parseInt(fields[7].substring(0,4));
              month = parseInt(fields[7].substring(4,6));
              day = parseInt(fields[7].substring(6,8));
              doses.push(new VaccinationDose(fields[5], fields[6], new Date(year, month-1, day)));
              year = parseInt(fields[10].substring(0,4));
              month = parseInt(fields[10].substring(4,6));
              day = parseInt(fields[10].substring(6,8));
              doses.push(new VaccinationDose(fields[8], fields[9], new Date(year, month-1, day)));
              this.vax.Doses = doses;
              break;
            }
            case 'BM.PCR.1': {
              this.verifyVersion = "PCR TEST CERTIFICATE"
              this.pcr.LastName = fields[0];
              this.pcr.FirstName = fields[1];
              this.pcr.MiddleName = fields[2];
              year = parseInt(fields[3].substring(0,4));
              month = parseInt(fields[3].substring(4,6));
              day = parseInt(fields[3].substring(6,8));
              this.pcr.DateOfBirth = new Date(year, month-1, day);
              this.pcr.Gender = fields[4];
              this.pcr.UniqueId = parseInt(fields[5]);
              this.pcr.ConfirmationNumber = parseInt(fields[6]);
              year = parseInt(fields[7].substring(0,4));
              month = parseInt(fields[7].substring(4,6));
              day = parseInt(fields[7].substring(6,8));
              this.pcr.SampleReceivedDate = new Date(year, month-1, day);
              year = parseInt(fields[8].substring(0,4));
              month = parseInt(fields[8].substring(4,6));
              day = parseInt(fields[8].substring(6,8));
              this.pcr.ResultReceivedDate = new Date(year, month-1, day);
              this.pcr.TestType = fields[9];
              this.pcr.Result = fields[10];
              break;
            }
          }
      }
  }
}
</script>
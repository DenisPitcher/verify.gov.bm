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
        <v-list-item v-if="typeVersion == 'BM.KEY.1'">
          <v-list-item-content>
            <p><b>Initials:</b> {{ pass.Initials }}</p>
            <p><b>Birth Day:</b> {{ pass.BirthMonthDay }}</p>
            <p><b>Expiry Date:</b> {{ pass.ExpiryDate  | moment("dddd, MMMM Do YYYY") }}</p>
          </v-list-item-content>
          <v-list-item-avatar 
              width="155"
              height="98"
            >
              <v-img
                alt="Bermuda Safe Key"
                src="@/assets/safeKey.png"
              />
            </v-list-item-avatar>
        </v-list-item>
        
        <v-card-text v-if="typeVersion == 'BM.VAX.1'">
          <b>LastName:</b> {{ vax.LastName }}<br/>
          <b>FirstName:</b> {{ vax.FirstName }}<br/>
          <b>Patient #:</b> {{ vax.ReservationId }}<br/>
          <b>Gender:</b> {{ vax.Gender }}<br/>
          <b>Doses:</b><br/>
          <v-container class="ma-2">
            <v-row>
              <v-col class="ma-0 pa-0 col-3">
                <b>Type:</b>
              </v-col>
              <v-col class="ma-0 pa-0 col-3">
                <b>Lot #:</b>
              </v-col>
              <v-col class="ma-0 pa-0 col-6">
                <b>Date:</b>
              </v-col>
            </v-row>
            <v-row 
              v-for="item in vax.Doses"
              :key="item.Num"
              >
              <v-col class="ma-0 pa-0 col-3">
                {{ item.Manufacturer }}
              </v-col>
              <v-col class="ma-0 pa-0 col-3">
                {{ item.LotNumber }}
              </v-col>
              <v-col class="ma-0 pa-0 col-6">
                {{ item.Date | moment("MMMM Do YYYY") }}
              </v-col>
            </v-row>
          </v-container>
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
        <v-card-text v-if="typeVersion == 'BM.ANTIGEN.1'">
          <p><b>LastName:</b> {{ antigen.LastName }}</p>
          <p><b>FirstName:</b> {{ antigen.FirstName }}</p>
          <p><b>MiddleName:</b> {{ antigen.MiddleName }}</p>
          <p><b>Gender:</b> {{ antigen.Gender }}</p>
          <p><b>Unique Id:</b> {{ antigen.UniqueId }}</p>
          <p><b>Confirmation Number:</b> {{ antigen.ConfirmationNumber }}</p>
          <p><b>Sample Received Date:</b> {{ antigen.SampleReceivedDate | moment("dddd, MMMM Do YYYY") }}</p>
          <p><b>Result Received Date:</b> {{ antigen.ResultReceivedDate | moment("dddd, MMMM Do YYYY") }}</p>
          <p><b>Test Type:</b> {{ antigen.TestType }}</p>
          <p><b>Result:</b> {{ antigen.Result }}</p>
        </v-card-text>
        <v-list-item v-if="typeVersion == 'BM.CONTACTKEY.1'">
          <v-list-item-content >
          <p><b>Initials:</b> {{ contact.Initials }}</p>
          <p><b>Birth Day:</b> {{ contact.BirthMonthDay }}</p>
          <p><b>Expiry Date:</b> {{ contact.ExpiryDate  | moment("dddd, MMMM Do YYYY") }}</p>
          <p><b>Unique Id:</b> {{ contact.UniqueId }}</p>
          </v-list-item-content>
          <v-list-item-avatar 
              width="155"
              height="98"
            >
              <v-img
                alt="Bermuda Safe Key"
                src="@/assets/safeKey.png"
              />
            </v-list-item-avatar>
        </v-list-item>
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
import AntigenTestCertificate from '@/models/AntigenTestCertificate';
import ContactKey from '@/models/ContactKey';

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
  private antigen: AntigenTestCertificate = new AntigenTestCertificate();
  private contact: ContactKey = new ContactKey();
  private pcf = new PCF();

  constructor() {
    super()
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
          this.typeVersion = type + '.' + version;

          if (process.env.NODE_ENV === 'development')
          {
            this.result = this.pcf.verifyDebug(payload, signatureBase32NoPad);
          }
          else if (pubKeyLink === "KEYS.GOV.BM")
          {
            this.result = this.pcf.verifyCertificate(payload, signatureBase32NoPad);
            if (this.result === false && this.typeVersion == 'BM.KEY.1'){
              this.result = this.pcf.verifySafeKey(payload, signatureBase32NoPad);
            }
          }
          else{
            console.log('Environment: ' + process.env.NODE_ENV + ', pubKeyLink: ' + pubKeyLink + ' not supported');
            this.result = false;
            return;
          }
          
          const fields = this.pcf.parsePayload(payload);
          

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
              var dateCheck = new Date();
              dateCheck.setHours(0,0,0,0);
              if (dateCheck > this.pass.ExpiryDate)
              {
                this.result = false;
              }
              break;
            }
            case 'BM.VAX.1': {
              this.verifyVersion = 'VACCINATION CERTIFICATE'
              this.vax.FirstName = fields[0];
              this.vax.LastName = fields[1];
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
              doses.push(new VaccinationDose(1, fields[5], fields[6], new Date(year, month-1, day)));
              year = parseInt(fields[10].substring(0,4));
              month = parseInt(fields[10].substring(4,6));
              day = parseInt(fields[10].substring(6,8));
              doses.push(new VaccinationDose(2, fields[8], fields[9], new Date(year, month-1, day)));
              if (fields.length > 10 && fields[11] !== "")
              {
                year = parseInt(fields[13].substring(0,4));
                month = parseInt(fields[13].substring(4,6));
                day = parseInt(fields[13].substring(6,8));
                doses.push(new VaccinationDose(3, fields[11], fields[12], new Date(year, month-1, day)));
              }
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
            case 'BM.ANTIGEN.1': {
              this.verifyVersion = "ANTIGEN TEST CERTIFICATE"
              this.antigen.LastName = fields[0];
              this.antigen.FirstName = fields[1];
              this.antigen.MiddleName = fields[2];
              year = parseInt(fields[3].substring(0,4));
              month = parseInt(fields[3].substring(4,6));
              day = parseInt(fields[3].substring(6,8));
              this.antigen.DateOfBirth = new Date(year, month-1, day);
              this.antigen.Gender = fields[4];
              this.antigen.UniqueId = parseInt(fields[5]);
              this.antigen.ConfirmationNumber = parseInt(fields[6]);
              year = parseInt(fields[7].substring(0,4));
              month = parseInt(fields[7].substring(4,6));
              day = parseInt(fields[7].substring(6,8));
              this.antigen.SampleReceivedDate = new Date(year, month-1, day);
              year = parseInt(fields[8].substring(0,4));
              month = parseInt(fields[8].substring(4,6));
              day = parseInt(fields[8].substring(6,8));
              this.antigen.ResultReceivedDate = new Date(year, month-1, day);
              this.antigen.TestType = fields[9];
              this.antigen.Result = fields[10];
              break;
            }
            case 'BM.CONTACTKEY.1': {
              this.verifyVersion = 'CONTACT TRACING KEY'
              year = parseInt(fields[0].substring(0,4));
              month = parseInt(fields[0].substring(4,6));
              day = parseInt(fields[0].substring(6,8));
              this.contact.ExpiryDate = new Date(year, month-1, day);
              this.contact.Initials = fields[1];
              this.contact.BirthMonthDay = fields[2];
              this.contact.UniqueId = fields[3];
              var contactDateCheck = new Date();
              contactDateCheck.setHours(0,0,0,0);
              if (contactDateCheck > this.contact.ExpiryDate)
              {
                this.result = false;
              }
              break;
            }
          }
      }
  }
}
</script>
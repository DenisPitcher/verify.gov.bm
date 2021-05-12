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
        class="mx-auto my-12"
        >
        <template 
          v-if="result == true"
          class="justify-center">
          <v-card-title>
            <v-icon
              color="green"
              size="7rem"
            >
              mdi-shield-check
            </v-icon>
            Verified
          </v-card-title>
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
            Not valid
          </v-card-title>
        </template>
        <v-card-text v-if="typeVersion == 'BM.PASS.1'">
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
import CovidPass from '@/models/CovidPass';
import VaccinationCertificate from '@/models/VaccinationCertificate';
import VaccinationDose from '@/models/VaccinationDose';


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
  private pass: CovidPass = new CovidPass();
  private vax: VaccinationCertificate = new VaccinationCertificate();

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
    let pcf = new PCF();
      // if (!data)
      //     data = e("qr-verify").value;

      if (data !== "" && data != null && typeof(data) === 'string' && data.startsWith("CRED:")) {
          let uri = data.substring(data.indexOf("CRED:"));
      
          const [schema, type, version, signatureBase32NoPad, pubKeyLink, payload] = pcf.parseURI(uri);  
          this.result = pcf.downloadKeyVerify(pubKeyLink, payload, signatureBase32NoPad);
          const fields = pcf.parsePayload(payload);
          this.typeVersion = type + '.' + version;

          var year;
          var month;
          var day;
          switch(this.typeVersion){
            case 'BM.PASS.1': {
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
          }
          
      }
  }
}
</script>
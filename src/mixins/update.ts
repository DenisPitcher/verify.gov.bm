// https://dev.to/drbragg/handling-service-worker-updates-in-your-vue-pwa-1pip

import { Vue, Component } from "vue-property-decorator";

@Component
export default class update extends Vue {
  public refreshing = false;
  public registration: any = null;
  public updateExists = false;
 
  constructor() {
    super()
    this.created();
  }

  created(): void {

    // Listen for our custom event from the SW registration
    document.addEventListener('swUpdated', this.updateAvailable, { once: true })

    // Prevent multiple refreshes
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (this.refreshing) return
      this.refreshing = true
      // Here the actual reload of the page occurs
      window.location.reload()
    })
  }
  
   
  // Store the SW registration so we can send it a message
  // We use `updateExists` to control whatever alert, toast, dialog, etc we want to use
  // To alert the user there is an update they need to refresh for
  updateAvailable(event: any): void {
    this.registration = event.detail
    this.updateExists = true
    //this.refreshApp();
  }
  
  // Called when the user accepts the update
  refreshApp(): void {
    this.updateExists = false
    // Make sure we only send a 'skip waiting' message if the SW is waiting
    if (!this.registration || !this.registration.waiting) return
    // send message to SW to skip the waiting and activate the new SW
    this.registration.waiting.postMessage({ type: 'SKIP_WAITING' })
  }
}
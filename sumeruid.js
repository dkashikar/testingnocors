// supabaseScript.js

class SumeruId {

  static supabaseUrl = 'https://d8r3p90s-54341.inc1.devtunnels.ms'
  static supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
  static sumeruIdUrl = 'https://d8r3p90s-3000.inc1.devtunnels.ms'


  constructor(options) {
    this.options = options ?? {};
    this.supabase = null;
    this.realtimeSubscription = null;
    this.initSumeru();
  }

  async initSumeru() {
    this.supabase = supabase.createClient('https://d8r3p90s-54341.inc1.devtunnels.ms', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0');
    if (!this.supabase) {
      console.error('Supabase client not initialized.');
      return;
    }
    const scriptTag = document.currentScript;
    this.options.id = this.options.qrid ?? scriptTag.getAttribute('data-qrid');
    this.options.apikey = this.options.sumeruKey ?? scriptTag.getAttribute('data-sumeru-key');
    this.options.onScanned = this.options.onScan ?? this.getFunctionByName(scriptTag.getAttribute('data-on-scan'));

    
    await this.getQrCode()
  }

  async getQrCode() {
    const resp = await fetch(`https://d8r3p90s-3000.inc1.devtunnels.ms/auth/tokens`, { headers: { Authorization: this.options.apikey } })
    const qrcode = await resp.json()
    if (qrcode.status) {
      this.qrcode = qrcode.data
      this.qrdisplay = new QRious({
        element: document.getElementById(this.options.id),
        value: qrcode.data.qrcode,
        padding: 20,
        size: 500
      });
      this.startRealtimeConnection()
    }
  }

  async startRealtimeConnection() {


    this.realtimeSubscription = this.supabase.channel(this.options.apikey)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tokens', filter: `id=eq.${this.qrcode.id}` },
        this.options.onScanned
      )
      .subscribe()

    console.log(`Monitoring qrcode: ${this.qrcode.id}`);
    setTimeout(() => {
      this.stopRealtimeConnection();
    }, 120000);
  }

  stopRealtimeConnection() {
    if (this.realtimeSubscription) {
      this.realtimeSubscription.unsubscribe();
      console.log('Real-time connection closed.');
    }
    this.qrdisplay.value = '0'
  }

  getFunctionByName(functionName) {
    return window[functionName] instanceof Function ? window[functionName] : null;
  }
}


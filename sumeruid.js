class SumeruId {

  static supabaseUrl = 'https://d8r3p90s-54341.inc1.devtunnels.ms'
  static supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
  static sumeruIdUrl = 'https://d8r3p90s-3000.inc1.devtunnels.ms'
  static supabaseLib  = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js'
  static qrcodeLib = 'https://cdnjs.cloudflare.com/ajax/libs/qrious/4.0.2/qrious.min.js'


  constructor(options) {
    this.options = options ?? {};
    this.supabase = null;
    this.realtimeSubscription = null;
    this.initSumeru();
  }


  async loadLib(url) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = url;
      script.async = true;
  
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load library'));
  
      document.head.appendChild(script);
    });
  }
  

  async initSumeru() {
    try {
      await this.loadLib(SumeruId.supabaseLib);
      console.log('Supabase library has been loaded.');
    } catch (error) {
      console.error('Error loading Supabase library:', error);
    }
    this.supabase = supabase.createClient(SumeruId.supabaseUrl, SumeruId.supabaseAnonKey);
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
    try {
      await this.loadLib(SumeruId.qrcodeLib);
      console.log('Supabase library has been loaded.');
    } catch (error) {
      console.error('Error loading Supabase library:', error);
    }
    const resp = await fetch(`${SumeruId.sumeruIdUrl}/auth/tokens`, { headers: { Authorization: this.options.apikey } })
    const qrcode = await resp.json()
    if (qrcode.status) {
      this.qrcode = qrcode.data
      this.qrdisplay = new QRious({
        element: document.getElementById(this.options.qrid),
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


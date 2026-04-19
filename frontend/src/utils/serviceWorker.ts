// Service Worker registration and management

const isLocalhost = Boolean(
  window.location.hostname === 'localhost' ||
  window.location.hostname === '[::1]' ||
  window.location.hostname.match(
    /^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/
  )
);

interface ServiceWorkerConfig {
  onSuccess?: (registration: ServiceWorkerRegistration) => void;
  onUpdate?: (registration: ServiceWorkerRegistration) => void;
  onOffline?: () => void;
  onOnline?: () => void;
}

export function register(config?: ServiceWorkerConfig) {
  if ('serviceWorker' in navigator) {
    const publicUrl = new URL(process.env.PUBLIC_URL!, window.location.href);
    
    if (publicUrl.origin !== window.location.origin) {
      // Our service worker won't work if PUBLIC_URL is on a different origin
      return;
    }

    window.addEventListener('load', () => {
      const swUrl = `${process.env.PUBLIC_URL}/sw.js`;

      if (isLocalhost) {
        // Running on localhost
        checkValidServiceWorker(swUrl, config);

        // Add some additional logging to localhost
        navigator.serviceWorker.ready.then(() => {
          console.log(
            '🔧 This web app is being served cache-first by a service worker. ' +
            'To learn more, visit https://bit.ly/CRA-PWA'
          );
        });
      } else {
        // Production environment
        registerValidSW(swUrl, config);
      }
    });

    // Listen for online/offline events
    window.addEventListener('online', () => {
      console.log('🌐 App is now online');
      config?.onOnline?.();
    });

    window.addEventListener('offline', () => {
      console.log('📴 App is now offline');
      config?.onOffline?.();
    });
  }
}

function registerValidSW(swUrl: string, config?: ServiceWorkerConfig) {
  navigator.serviceWorker
    .register(swUrl)
    .then((registration) => {
      console.log('✅ Service Worker registered successfully');

      registration.onupdatefound = () => {
        const installingWorker = registration.installing;
        if (installingWorker == null) {
          return;
        }

        installingWorker.onstatechange = () => {
          if (installingWorker.state === 'installed') {
            if (navigator.serviceWorker.controller) {
              // New content is available; please refresh.
              console.log(
                '🔄 New content is available and will be used when all tabs for this page are closed. ' +
                'See https://bit.ly/CRA-PWA.'
              );

              // Execute callback
              config?.onUpdate?.(registration);
            } else {
              // Content is cached for the first time.
              console.log('📦 Content is cached for offline use.');

              // Execute callback
              config?.onSuccess?.(registration);
            }
          }
        };
      };
    })
    .catch((error) => {
      console.error('❌ Error during service worker registration:', error);
    });
}

function checkValidServiceWorker(swUrl: string, config?: ServiceWorkerConfig) {
  // Check if the service worker can be found
  fetch(swUrl, {
    headers: { 'Service-Worker': 'script' },
  })
    .then((response) => {
      // Ensure service worker exists, and that we really are getting a JS file.
      const contentType = response.headers.get('content-type');
      if (
        response.status === 404 ||
        (contentType != null && contentType.indexOf('javascript') === -1)
      ) {
        // No service worker found. Probably a different app. Reload the page.
        navigator.serviceWorker.ready.then((registration) => {
          registration.unregister().then(() => {
            window.location.reload();
          });
        });
      } else {
        // Service worker found. Proceed as normal.
        registerValidSW(swUrl, config);
      }
    })
    .catch(() => {
      console.log('📴 No internet connection found. App is running in offline mode.');
    });
}

export function unregister() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then((registration) => {
        registration.unregister();
        console.log('🗑️ Service Worker unregistered');
      })
      .catch((error) => {
        console.error('❌ Error during service worker unregistration:', error);
      });
  }
}

// Install app prompt
let deferredPrompt: any;

export function initializeInstallPrompt() {
  window.addEventListener('beforeinstallprompt', (e) => {
    console.log('💾 Install prompt available');
    // Prevent Chrome 67 and earlier from automatically showing the prompt
    e.preventDefault();
    // Stash the event so it can be triggered later.
    deferredPrompt = e;
  });

  window.addEventListener('appinstalled', () => {
    console.log('📱 PWA was installed');
    deferredPrompt = null;
  });
}

export function showInstallPrompt(): Promise<boolean> {
  return new Promise((resolve) => {
    if (!deferredPrompt) {
      console.log('❌ Install prompt not available');
      resolve(false);
      return;
    }

    // Show the prompt
    deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    deferredPrompt.userChoice.then((choiceResult: { outcome: string }) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('✅ User accepted the install prompt');
        resolve(true);
      } else {
        console.log('❌ User dismissed the install prompt');
        resolve(false);
      }
      deferredPrompt = null;
    });
  });
}

export function isInstallPromptAvailable(): boolean {
  return !!deferredPrompt;
}

// Check if app is installed
export function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true
  );
}
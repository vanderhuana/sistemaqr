<template>
  <v-app>
    <!-- Header FEIPOBOL -->
    <v-app-bar
      class="feipobol-header"
      height="80"
      elevation="0"
    >
      <div class="feipobol-logo">
        <!-- Logo triangular de FEIPOBOL -->
        <div class="logo-triangle">
          <svg width="60" height="60" viewBox="0 0 100 100">
            <!-- Montaña principal -->
            <polygon points="10,90 50,10 90,90" fill="#FF6B35"/>
            <!-- Montaña secundaria -->
            <polygon points="20,90 60,25 85,90" fill="#FF9500"/>
            <!-- Detalles arquitectónicos -->
            <circle cx="35" cy="45" r="3" fill="white"/>
            <rect x="32" y="48" width="6" height="12" fill="#FFD700"/>
            <polygon points="55,60 65,50 75,60" fill="#FF4444"/>
          </svg>
        </div>
        
        <div>
          <div class="feipobol-title">FEIPOBOL</div>
          <div class="feipobol-subtitle">EN EL BICENTENARIO DE BOLIVIA 🇧🇴</div>
        </div>
      </div>

      <v-btn
        class="btn-ingresar"
        @click="goToLogin"
        elevation="0"
      >
        INGRESAR
      </v-btn>
    </v-app-bar>

    <!-- Contenido principal -->
    <v-main class="main-content">
      <v-container fluid class="pa-0">
        <v-row no-gutters class="fill-height">
          <!-- Sección izquierda: Texto -->
          <v-col cols="12" lg="6" class="d-flex align-center">
            <div class="content-section fade-in-up">
              <h1 class="section-title">
                SISTEMA DE CONTROL<br>
                Y MONITOREO
              </h1>
              
              <p class="section-subtitle">
                SOLO PERSONAL AUTORIZADO
              </p>

              <v-btn
                class="btn-ingresar"
                size="x-large"
                @click="goToLogin"
                elevation="0"
              >
                <v-icon left>mdi-login</v-icon>
                INGRESAR
              </v-btn>

              <!-- Información adicional -->
              <div class="mt-8">
                <v-card
                  class="feipobol-card"
                  elevation="0"
                  style="background: linear-gradient(45deg, #6B9080, #8FA89B); color: white;"
                >
                  <v-card-text class="text-center">
                    <v-icon size="32" class="mb-2">mdi-qrcode-scan</v-icon>
                    <div class="text-h6 font-weight-bold">Control de Acceso QR</div>
                    <div class="text-body-2 mt-2">
                      Sistema seguro de validación con códigos QR
                    </div>
                  </v-card-text>
                </v-card>
              </div>
            </div>
          </v-col>

          <!-- Sección derecha: Diseño artístico -->
          <v-col cols="12" lg="6" class="position-relative d-flex align-center justify-center">
            <div class="feipobol-mountains">
              <!-- Recreación artística del logo FEIPOBOL -->
              <svg width="500" height="400" viewBox="0 0 500 400" class="fade-in-up">
                <!-- Fondo de montañas -->
                <defs>
                  <linearGradient id="mountain1" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style="stop-color:#FF6B35;stop-opacity:1" />
                    <stop offset="50%" style="stop-color:#FF9500;stop-opacity:1" />
                    <stop offset="100%" style="stop-color:#FFD700;stop-opacity:1" />
                  </linearGradient>
                  <linearGradient id="mountain2" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style="stop-color:#FF4444;stop-opacity:1" />
                    <stop offset="100%" style="stop-color:#FF6B35;stop-opacity:1" />
                  </linearGradient>
                  <linearGradient id="base" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" style="stop-color:#6B9080;stop-opacity:1" />
                    <stop offset="100%" style="stop-color:#8FA89B;stop-opacity:1" />
                  </linearGradient>
                </defs>
                
                <!-- Montaña principal -->
                <polygon 
                  points="50,350 250,50 450,350" 
                  fill="url(#mountain1)"
                  class="pulse"
                />
                
                <!-- Montaña secundaria -->
                <polygon 
                  points="150,350 300,120 400,350" 
                  fill="url(#mountain2)"
                />
                
                <!-- Elementos arquitectónicos -->
                <circle cx="200" cy="180" r="8" fill="white"/>
                <rect x="195" y="190" width="10" height="20" fill="#FFD700"/>
                <polygon points="280,240 300,200 320,240" fill="#FF4444"/>
                
                <!-- Base -->
                <rect x="0" y="350" width="500" height="50" fill="url(#base)"/>
                
                <!-- Texto FEIPOBOL 2025 -->
                <text x="250" y="390" 
                      font-family="Inter, sans-serif" 
                      font-size="24" 
                      font-weight="800" 
                      text-anchor="middle" 
                      fill="white">
                  FEIPOBOL 2025
                </text>
              </svg>
            </div>
          </v-col>
        </v-row>
      </v-container>
    </v-main>

    <!-- Footer -->
    <v-footer class="feipobol-footer" elevation="0">
      <v-container>
        <v-row>
          <v-col cols="12" class="text-center">
            <div class="footer-content">
              <p class="copyright">
                © {{ new Date().getFullYear() }} FEIPOBOL - BICENTENARIO DE BOLIVIA
              </p>
              <p class="copyright">Todos los derechos reservados</p>
              <div class="developers">
                <p class="developers-title">Desarrollado por:</p>
              </div>
            </div>
          </v-col>
        </v-row>
      </v-container>
    </v-footer>
  </v-app>
</template>

<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

const goToLogin = () => {
  router.push('/login')
}
</script>

<style scoped>
/* Estilos específicos del componente */
.logo-triangle {
  background: white;
  border-radius: 12px;
  padding: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.position-relative {
  position: relative;
}

/* Animación del SVG */
.feipobol-mountains svg {
  filter: drop-shadow(0 10px 20px rgba(0,0,0,0.1));
}

/* Responsive específico */
@media (max-width: 960px) {
  .feipobol-mountains {
    margin-top: 2rem;
  }
  
  .feipobol-mountains svg {
    width: 400px;
    height: 320px;
  }
}

@media (max-width: 600px) {
  .feipobol-mountains svg {
    width: 300px;
    height: 240px;
  }
}

/* Footer Styles */
.feipobol-footer {
  background: linear-gradient(135deg, #2C3E50 0%, #34495E 100%);
  color: white;
  padding: 30px 0;
  margin-top: auto;
}

.footer-content {
  padding: 20px 0;
}

.copyright {
  margin: 5px 0;
  font-size: 14px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.9);
  letter-spacing: 0.5px;
}

.developers {
  margin-top: 20px;
  padding-top: 15px;
  border-top: 1px solid rgba(255, 255, 255, 0.2);
}

.developers-title {
  font-size: 13px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.developers-names {
  font-size: 14px;
  font-weight: 700;
  color: #FFD700;
  margin: 0;
  letter-spacing: 1px;
  line-height: 1.6;
}

@media (max-width: 768px) {
  .developers-names {
    font-size: 12px;
    word-break: break-word;
  }
  
  .copyright {
    font-size: 12px;
  }
}
</style>
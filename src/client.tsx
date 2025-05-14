/// <reference types="vinxi/types/client" />
import { scan } from 'react-scan'
import { hydrateRoot } from 'react-dom/client'
import { StartClient } from '@tanstack/react-start'
import { createRouter } from './router'
import { setupI18n } from './translations'

scan({ enabled: true })
setupI18n()

const router = createRouter()

hydrateRoot(document, <StartClient router={router} />)

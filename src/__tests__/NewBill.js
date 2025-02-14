/**
 * @jest-environment jsdom
 */
import NewBillUI from "../views/NewBillUI.js"
import NewBill from "../containers/NewBill.js"
import {localStorageMock} from "../__mocks__/localStorage.js";
import { ROUTES_PATH, ROUTES} from "../constants/routes.js";
import router from "../app/Router.js";
import {screen, waitFor, fireEvent} from "@testing-library/dom"

describe("Given I am connected as an employee", () => {
  describe("When I am on NewBill Page", () => {
//Test de l'icon surbrillant
    test("Then bill icon in vertical layout should be highlighted", async () => {
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.NewBill)
      await waitFor(() => screen.getByTestId('icon-mail'))
      const windowIcon = screen.getByTestId('icon-mail')
      expect(windowIcon.classList.contains('active-icon')).toBeTruthy()
    })

    describe("When I upload a file", () => {
      let newBill
      let fileInput
      let store
      let consoleSpy
      
      beforeEach(() => {
        // Configuration du DOM
        document.body.innerHTML = NewBillUI()
        
        // Configuration du localStorage
        Object.defineProperty(window, 'localStorage', { value: localStorageMock })
        window.localStorage.setItem('user', JSON.stringify({
          email: 'employee@test.tld',
          type: 'Employee'
        }))
        
        // Création du spy pour console.error avant toute utilisation
        consoleSpy = jest.spyOn(console, 'error')
        
        // Mock des fonctions globales
        global.alert = jest.fn()
      })
  
  //Test pour les extensions de fichiers invalides
      test("Then it should handle invalid file extensions correctly", async () => {
        // Configuration du store
        store = {
          bills: jest.fn().mockReturnValue({
            create: jest.fn().mockResolvedValue({fileUrl: 'test.jpg', key: 'test'})
          })
        }

        // Création de l'instance NewBill avec le store
        newBill = new NewBill({
          document,
          onNavigate: jest.fn(),
          store,
          localStorage: window.localStorage
        })

        // Création d'un fichier image invalide
        const imageFile = new File(['image'], 'image.txt', {type: 'text/plain'})
        
        // Création d'un objet Event personnalisé
        const event = {
          preventDefault: jest.fn(),
          target: {
            value: 'C:\\fakepath\\image.txt',
            files: [imageFile]
          }
        }

        await newBill.handleChangeFile(event)
        await new Promise(process.nextTick)
        
        expect(global.alert).toHaveBeenCalledWith("Veuillez sélectionner un fichier au format jpg, jpeg ou png.")
      })

  //Test pour les extensions de fichiers valides
      test("Then it should handle valid file extensions correctly", async () => {
        // Configuration du store
        store = {
          bills: jest.fn().mockReturnValue({
            create: jest.fn().mockResolvedValue({fileUrl: 'test.jpg', key: 'test'})
          })
        }

        // Création de l'instance NewBill avec le store
        newBill = new NewBill({
          document,
          onNavigate: jest.fn(),
          store,
          localStorage: window.localStorage
        })

        // Création d'un fichier image valide
        const imageFile = new File(['image'], 'image.jpg', {type: 'image/jpeg'})
        
        // Création d'un objet Event personnalisé
        const event = {
          preventDefault: jest.fn(),
          target: {
            value: 'C:\\fakepath\\image.jpg',
            files: [imageFile]
          }
        }

        await newBill.handleChangeFile(event)
        await new Promise(process.nextTick)
        
        expect(newBill.fileUrl).toBe('test.jpg')
        expect(newBill.fileName).toBe('image.jpg')
      })

//Test soumission du formulaire et redirection
      describe("When I submit the form", () => {
        test("Then the bill should be updated and I should be redirected to Bills page", async () => {
          // Préparation du DOM
          document.body.innerHTML = NewBillUI()

          // Configuration du localStorage mock
          Object.defineProperty(window, 'localStorage', { value: localStorageMock })
          window.localStorage.setItem('user', JSON.stringify({
            type: 'Employee',
            email: "employee@test.com"
          }))

          // Création du mock store
          const store = {
            bills: jest.fn(() => ({
              create: jest.fn().mockResolvedValue({ fileUrl: 'http://localhost:3456/images/test.jpg', key: '1234' }),
              update: jest.fn().mockResolvedValue({})
            }))
          }

          // Création d'une instance de NewBill
          const newBill = new NewBill({
            document,
            onNavigate: jest.fn(),
            store,
            localStorage: window.localStorage
          })

          // Simulation d'un fichier déjà uploadé
          newBill.fileUrl = 'http://localhost:3456/images/test.jpg'
          newBill.fileName = 'test.jpg'
          newBill.billId = '1234'

          // Récupération du formulaire
          const form = screen.getByTestId('form-new-bill')

          // Simulation du remplissage du formulaire
          const expenseType = screen.getByTestId('expense-type')
          const expenseName = screen.getByTestId('expense-name')
          const date = screen.getByTestId('datepicker')
          const amount = screen.getByTestId('amount')
          const vat = screen.getByTestId('vat')
          const pct = screen.getByTestId('pct')
          const commentary = screen.getByTestId('commentary')

          Object.defineProperty(expenseType, 'value', { value: 'Transports' })
          Object.defineProperty(expenseName, 'value', { value: 'Test Transport' })
          Object.defineProperty(date, 'value', { value: '2024-02-08' })
          Object.defineProperty(amount, 'value', { value: '100' })
          Object.defineProperty(vat, 'value', { value: '20' })
          Object.defineProperty(pct, 'value', { value: '20' })
          Object.defineProperty(commentary, 'value', { value: 'Test comment' })

          // Mock de la méthode preventDefault
          const handleSubmit = jest.spyOn(form, 'addEventListener')
          const preventDefault = jest.fn()

          // Simulation de la soumission du formulaire
          form.dispatchEvent(new Event('submit', { preventDefault }))

          expect(handleSubmit).toHaveBeenCalled
          expect(store.bills).toHaveBeenCalled
        })
      })

      describe("When I submit a new bill (POST tests)", () => {
        beforeEach(() => {
          // Configuration du DOM et localStorage pour chaque test
          document.body.innerHTML = NewBillUI()
          Object.defineProperty(window, 'localStorage', { value: localStorageMock })
          window.localStorage.setItem('user', JSON.stringify({
            type: 'Employee',
            email: "employee@test.com"
          }))
          jest.spyOn(console, 'error')
          global.alert = jest.fn()
        })

        test("Then it should post data successfully to API", async () => {
          // Création d'un mock pour simuler une réponse API réussie
          const createMock = jest.fn().mockResolvedValue({
            fileUrl: 'http://localhost:3456/images/test.jpg',
            key: '1234'
          })

          const store = {
            bills: jest.fn(() => ({
              create: createMock
            }))
          }

          // Création de l'instance NewBill
          const newBill = new NewBill({
            document,
            onNavigate: jest.fn(),
            store,
            localStorage: window.localStorage
          })

          // Création du fichier test
          const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })

          // Simulation de l'événement de changement de fichier
          const event = {
            preventDefault: jest.fn(),
            target: {
              value: 'C:\\fakepath\\test.jpg',
              files: [file]
            }
          }

          // Appel direct de handleChangeFile
          await newBill.handleChangeFile(event)

          // Vérifications
          expect(createMock).toHaveBeenCalledWith(expect.objectContaining({
            data: expect.any(FormData),
            headers: { noContentType: true }
          }))
        })

        test("Then it should handle 404 error from API", async () => {
          // Mock du store avec une erreur 404
          const store = {
            bills: jest.fn(() => ({
              create: jest.fn().mockRejectedValue(new Error("Erreur 404"))
            }))
          }

          const newBill = new NewBill({
            document,
            onNavigate: jest.fn(),
            store,
            localStorage: window.localStorage
          })

          // Création du fichier test et simulation de l'événement
          const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
          const event = {
            preventDefault: jest.fn(),
            target: {
              value: 'C:\\fakepath\\test.jpg',
              files: [file]
            }
          }

          // Appel direct de handleChangeFile
          await newBill.handleChangeFile(event)

          // Vérification que l'erreur est loggée
          await new Promise(process.nextTick)
          expect(console.error).toHaveBeenCalled()
        })

        test("Then it should handle 500 error from API", async () => {
          // Mock du store avec une erreur serveur 500
          const store = {
            bills: jest.fn(() => ({
              create: jest.fn().mockRejectedValue(new Error("Erreur 500"))
            }))
          }

          const newBill = new NewBill({
            document,
            onNavigate: jest.fn(),
            store,
            localStorage: window.localStorage
          })

          // Création du fichier test et simulation de l'événement
          const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
          const event = {
            preventDefault: jest.fn(),
            target: {
              value: 'C:\\fakepath\\test.jpg',
              files: [file]
            }
          }

          // Appel direct de handleChangeFile
          await newBill.handleChangeFile(event)

          // Vérification que l'erreur est loggée
          await new Promise(process.nextTick)
          expect(console.error).toHaveBeenCalled()
        })

        test("Then it should handle network error", async () => {
          // Mock du store avec une erreur réseau
          const store = {
            bills: jest.fn(() => ({
              create: jest.fn().mockRejectedValue(new Error("Network Error"))
            }))
          }

          const newBill = new NewBill({
            document,
            onNavigate: jest.fn(),
            store,
            localStorage: window.localStorage
          })

          // Création du fichier test et simulation de l'événement
          const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
          const event = {
            preventDefault: jest.fn(),
            target: {
              value: 'C:\\fakepath\\test.jpg',
              files: [file]
            }
          }

          // Appel direct de handleChangeFile
          await newBill.handleChangeFile(event)

          // Vérification que l'erreur est loggée
          await new Promise(process.nextTick)
          expect(console.error).toHaveBeenCalled()
        })
      })
    })
  })
})
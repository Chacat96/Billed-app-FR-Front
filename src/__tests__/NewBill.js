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

      test("Then submit event should be handled correctly", async () => {
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

        // Création d'un objet Event personnalisé
        const event = {
          preventDefault: jest.fn(),
          target: {
            querySelector: jest.fn().mockReturnValue({
              value: 'test',
              files: ['test']
            })
          }
        }

        await newBill.handleSubmit(event)
        await new Promise(process.nextTick)
        
        expect(event.preventDefault).toHaveBeenCalled()
        expect(store.bills().create).toHaveBeenCalled()
      })
    })
  })
})
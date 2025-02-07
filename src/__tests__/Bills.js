/**
 * @jest-environment jsdom
 */

import {screen, waitFor, fireEvent} from "@testing-library/dom"
import BillsUI from "../views/BillsUI.js"
import { bills } from "../fixtures/bills.js"
import { ROUTES_PATH, ROUTES} from "../constants/routes.js";
import {localStorageMock} from "../__mocks__/localStorage.js";
import mockedStore from "../__mocks__/store.js";
import mockStore from "../__mocks__/store";
import router from "../app/Router.js";
import Bills from "../containers/Bills.js";
import '@testing-library/jest-dom'
import userEvent from '@testing-library/user-event'

jest.mock("../app/store", () => mockStore)

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {

      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.Bills)
      await waitFor(() => screen.getByTestId('icon-window'))
      const windowIcon = screen.getByTestId('icon-window')
      expect(windowIcon.classList.contains('active-icon')).toBeTruthy()
      //to-do write expect expression

    })
    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills })
      const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i).map(a => a.innerHTML)
      const antiChrono = (a, b) => ((a < b) ? 1 : -1)
      const datesSorted = [...dates].sort(antiChrono)
      expect(dates).toEqual(datesSorted)
    })

    //Test l'indicateur de chargement
    describe('When I am on Bills page but it is loading', () => {
      test('Then, Loading page should be rendered', () => {
        document.body.innerHTML = BillsUI({ loading: true })
        expect(screen.getAllByText('Loading...')).toBeTruthy()
      })
    })
    // Test message d'erreur
    describe('When I am on Bills page but back-end send an error message', () => {
      test('Then, Error page should be rendered', () => {
        document.body.innerHTML = BillsUI({ error: 'Failed to fetch' })
        expect(screen.getAllByText('Erreur')).toBeTruthy()
      })
    })

    

    //Icon de l'oeil qui ouvre la modal
    describe("When I click on eye icon", () => {
      test("Then a modal should open", async () => {
        const onNavigate = pathname => {
          document.body.innerHTML = ROUTES({ pathname })
        }

        Object.defineProperty(window, "localStorage", {
          value: localStorageMock,
        })

        window.localStorage.setItem(
            "user",
            JSON.stringify({
              type: "Employee",
            })
        )

        const billsPage = new Bills({
          document,
          onNavigate,
          store: mockedStore,
          localStorage: window.localStorage,
        })

        document.body.innerHTML = BillsUI({ data: bills })

        const eyes = screen.getAllByTestId("icon-eye")

        const handleClickIconEye = jest.fn(billsPage.handleClickIconEye)

        const modale = document.getElementById("modaleFile")

        $.fn.modal = jest.fn(() => modale.classList.add("show")) 

        eyes.forEach(eyes => {
          eyes.addEventListener("click", () => handleClickIconEye(eyes))
          userEvent.click(eyes)

          expect(handleClickIconEye).toHaveBeenCalled()

          expect(modale).toHaveClass("show")
        })
      })
    })
  })

  //test qui affiche NewBill quand je clique sur "Nouvelle note de frais"
  describe("When I click on Nouvelle note de frais", () => {
    test ("Then the page NewBill should be displayed", () => {
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.Bills)
      const newBill = screen.getByTestId("btn-new-bill")
      fireEvent.click(newBill)
      expect(screen.getByText("Envoyer une note de frais")).toBeTruthy()
    
    })
  })
})


// test d'intégration GET
describe("Given I am a user connected as Employee", () => {
  describe("When I navigate to Bills", () => {
    beforeEach(() => {
      jest.spyOn(mockStore, "bills");
    })

    test("fetches bills from mock API GET", async () => {
      window.onNavigate(ROUTES_PATH.Bills);
      const bills = await mockStore.bills().list();
      expect(await waitFor(() => screen.getByTestId("tbody"))).toBeTruthy();
      expect(bills.length).toBe(4);
    })

    test("fetches bills from an API and fails with 404 message error", async () => {
     
      mockStore.bills.mockImplementationOnce(() => {
        return {
          list: () => {
            return Promise.reject(new Error("Erreur 404"));
          }
        }
      })
      window.onNavigate(ROUTES_PATH.Bills);
      await new Promise(process.nextTick);
      const message = await screen.getByText(/Erreur 404/);
      expect(message).toBeTruthy();
    })

    test("fetches messages from an API and fails with 500 message error", async () => {
     
      mockStore.bills.mockImplementationOnce(() => {
        return {
          list: () => {
            return Promise.reject(new Error("Erreur 500"));
          }
        }
      })
      window.onNavigate(ROUTES_PATH.Bills);
      await new Promise(process.nextTick);
      const message = await screen.getByText(/Erreur 500/);
      expect(message).toBeTruthy();
    })
  })
})



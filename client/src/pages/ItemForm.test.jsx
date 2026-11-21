// Frontend tests for the ItemForm page — THIS is the only frontend file you edit.
// Run with:  npm test --workspace client
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import ItemForm from './ItemForm.jsx'
import { api } from '../api'

// Replace the real axios instance with fake (mock) functions — no server needed.
// In a test you decide what each one returns, e.g.
//   api.post.mockResolvedValue({ data: { item: {} } })                                  // success
//   api.post.mockRejectedValue({ response: { status: 409, data: { message: '...' } } }) // failure
// and afterwards check how it was called:
//   expect(api.post).toHaveBeenCalledWith('/items', { ... })
jest.mock('../api', () => ({
  api: { get: jest.fn(), post: jest.fn(), patch: jest.fn() }
}))

// Helper: renders ItemForm at `path`. "/items/new" = report mode, "/items/<id>" = edit mode.
// After a successful save the page navigates to /items, which renders the text "Items page".
function renderAt(path) {
  return render(
    <MemoryRouter initialEntries={[path]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route path="/items/new" element={<ItemForm />} />
        <Route path="/items/:id" element={<ItemForm />} />
        <Route path="/items" element={<div>Items page</div>} />
      </Routes>
    </MemoryRouter>
  )
}

// Reset every mock's calls and return values before each test.
beforeEach(() => jest.clearAllMocks())

describe('ItemForm — report mode (/items/new)', () => {
  // Worked example — read it, then write the two tests below in the same style.
  test('renders all fields with their default values', () => {
    renderAt('/items/new')
    expect(screen.getByRole('heading', { name: /report item/i })).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/title/i)).toHaveValue('')
    const [status, category] = screen.getAllByRole('combobox') // the two <select>s
    expect(status).toHaveValue('lost')
    expect(category).toHaveValue('other')
  })

  
test('submitting POSTs the correct fields and navigates to /items', async () => {
  // 1. Simulate a successful API response
  api.post.mockResolvedValue({ data: { item: {} } })

  // 2. Open the report form
  const user = userEvent.setup()
  renderAt('/items/new')

  // 3. Fill in the form
  await user.type(screen.getByPlaceholderText(/title/i), 'Black backpack')
  await user.selectOptions(screen.getAllByRole('combobox')[0], 'lost')
  await user.selectOptions(screen.getAllByRole('combobox')[1], 'accessories')
  await user.type(screen.getByPlaceholderText(/location/i), 'Library')
  await user.type(screen.getByPlaceholderText(/description/i), 'Contains books')

  // 4. Submit the form
  await user.click(screen.getByRole('button', { name: /save/i }))

  // 5. Verify the exact data sent to the API
  await waitFor(() => {
    expect(api.post).toHaveBeenCalledWith('/items', {
      title: 'Black backpack',
      status: 'lost',
      category: 'accessories',
      location: 'Library',
      description: 'Contains books'
    })
  })

  // 6. Verify navigation to /items
  expect(await screen.findByText('Items page')).toBeInTheDocument()
})

  
test("shows the server's message when the request fails (e.g. 409) and stays on the page", async () => {
  // 1. Simulate a server error
  api.post.mockRejectedValue({
    response: {
      status: 409,
      data: { message: 'Duplicate item at this location' }
    }
  })

  // 2. Open the form
  const user = userEvent.setup()
  renderAt('/items/new')

  // 3. Fill in the form
  await user.type(screen.getByPlaceholderText(/title/i), 'Black backpack')
  await user.type(screen.getByPlaceholderText(/location/i), 'Library')

  // 4. Click Save
  await user.click(screen.getByRole('button', { name: /save/i }))

  // 5. Verify the server's error message appears
  expect(await screen.findByText('Duplicate item at this location')).toBeInTheDocument()

  // 6. Verify the user did not navigate away
  expect(screen.getByRole('heading', { name: /report item/i })).toBeInTheDocument()
  expect(screen.queryByText('Items page')).not.toBeInTheDocument()
})
})

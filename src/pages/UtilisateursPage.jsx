import { useState } from 'react'
import { getUsers, getUsersForAdmin, addUser, deleteUser, updateUserRole, getTotalVentes, getProducts, isDefaultAdmin } from '../lib/db'
import { useAuth } from '../context/AuthContext'
import { Plus, Trash2, X, BarChart3, ShoppingCart, Package } from 'lucide-react'

const roles = ['admin', 'vendeur', 'comptable']

export default function UtilisateursPage() {
  const { user } = useAuth()
  const getUserList = () => user?.role === 'admin' ? getUsersForAdmin(user.id) : getUsers()
  const [users, setUsers] = useState(getUserList)
  const [form, setForm] = useState(null)
  const refresh = () => setUsers(getUserList())

  const handleSave = () => {
    const result = addUser(form.nom, form.motDePasse, form.role)
    if (!result) { alert('Ce nom d\'utilisateur existe déjà'); return }
    setForm(null)
    refresh()
  }

  const handleDelete = (id) => {
    if (id === user?.id) { alert('Vous ne pouvez pas supprimer votre propre compte'); return }
    if (confirm('Supprimer cet utilisateur ?')) { deleteUser(id); refresh() }
  }

  const handleRole = (id, role) => {
    updateUserRole(id, role)
    refresh()
  }

  // Stats admin
  const totalVentes = getTotalVentes(new Date(Date.now() - 30 * 86400000))
  const totalProduits = getProducts().length

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold dark:text-white">Administration</h1>
        <button onClick={() => setForm({ nom: '', motDePasse: '', role: 'vendeur' })} className="btn-primary text-sm py-2">
          <Plus className="w-4 h-4" /> Ajouter
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white dark:bg-dark-800 rounded-xl p-4 border border-gray-100 dark:border-dark-700 flex items-center gap-3">
          <div className="w-10 h-10 bg-brand-50 dark:bg-brand-900/20 rounded-lg flex items-center justify-center"><BarChart3 className="w-5 h-5 text-brand-500" /></div>
          <div><p className="text-xs text-gray-500 dark:text-gray-400">Utilisateurs</p><p className="text-lg font-bold dark:text-white">{users.filter(u => user?.role === 'admin' ? u.role !== 'admin' || u.id === user?.id : true).length}</p></div>
        </div>
        <div className="bg-white dark:bg-dark-800 rounded-xl p-4 border border-gray-100 dark:border-dark-700 flex items-center gap-3">
          <div className="w-10 h-10 bg-green-50 dark:bg-green-900/20 rounded-lg flex items-center justify-center"><ShoppingCart className="w-5 h-5 text-green-500" /></div>
          <div><p className="text-xs text-gray-500 dark:text-gray-400">Ventes (30j)</p><p className="text-lg font-bold dark:text-white">{totalVentes}</p></div>
        </div>
        <div className="bg-white dark:bg-dark-800 rounded-xl p-4 border border-gray-100 dark:border-dark-700 flex items-center gap-3">
          <div className="w-10 h-10 bg-gold-50 dark:bg-gold-900/20 rounded-lg flex items-center justify-center"><Package className="w-5 h-5 text-gold-500" /></div>
          <div><p className="text-xs text-gray-500 dark:text-gray-400">Produits</p><p className="text-lg font-bold dark:text-white">{totalProduits}</p></div>
        </div>
      </div>

      {/* Users table */}
      <div className="bg-white dark:bg-dark-800 rounded-xl border border-gray-100 dark:border-dark-700 overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-dark-700 border-b dark:border-dark-700">
              <th className="px-4 py-3 font-medium">ID</th>
              <th className="px-4 py-3 font-medium">Nom</th>
              <th className="px-4 py-3 font-medium">Rôle</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.filter(u => user?.role === 'admin' ? u.role !== 'admin' || u.id === user?.id : true).map(u => {
              const isDef = isDefaultAdmin(u)
              return (
              <tr key={u.id} className={`border-b border-gray-50 dark:border-dark-700 last:border-0 ${isDef ? 'bg-amber-50/50 dark:bg-amber-900/10' : ''}`}>
                <td className="px-4 py-3 dark:text-gray-300">{u.id}</td>
                <td className="px-4 py-3 font-medium dark:text-white">
                  {u.nom}
                  {isDef && <span className="ml-2 px-1.5 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded text-[10px] font-medium">Principal</span>}
                </td>
                <td className="px-4 py-3">
                  <select value={u.role} onChange={e => handleRole(u.id, e.target.value)} className="text-xs border border-gray-200 dark:border-dark-600 rounded px-2 py-1 bg-white dark:bg-dark-900 dark:text-gray-100" disabled={isDef || u.id === user?.id}>
                    {roles.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </td>
                <td className="px-4 py-3">
                  <button onClick={() => handleDelete(u.id)} className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 dark:text-red-400" disabled={isDef || u.id === user?.id}>
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
              )
            })}
          </tbody>
        </table>
        </div>
      </div>

      {form && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-dark-800 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold dark:text-white">Nouvel utilisateur</h3>
              <button onClick={() => setForm(null)} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-dark-700"><X className="w-5 h-5 dark:text-gray-300" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Nom</label>
                <input value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })} className="w-full px-3 py-2 border border-gray-200 dark:border-dark-600 rounded-lg text-sm dark:bg-dark-900 dark:text-white" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Mot de passe</label>
                <input type="password" value={form.motDePasse} onChange={e => setForm({ ...form, motDePasse: e.target.value })} className="w-full px-3 py-2 border border-gray-200 dark:border-dark-600 rounded-lg text-sm dark:bg-dark-900 dark:text-white" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Rôle</label>
                <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} className="w-full px-3 py-2 border border-gray-200 dark:border-dark-600 rounded-lg text-sm bg-white dark:bg-dark-900 dark:text-gray-100">
                  {roles.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setForm(null)} className="btn-secondary text-sm py-2 px-4">Annuler</button>
              <button onClick={handleSave} className="btn-primary text-sm py-2 px-4" disabled={!form.nom || !form.motDePasse}>Enregistrer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

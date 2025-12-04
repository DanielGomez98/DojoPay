import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { Toaster, toast } from 'sonner'

// --- ICONOS ---
const IconHome = ({ active }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={active ? "#3b82f6" : "#94a3b8"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
)
const IconUsers = ({ active }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={active ? "#3b82f6" : "#94a3b8"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
)
const IconLogout = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
)

// --- LOGIN ---
function LoginScreen() {
  const [usuario, setUsuario] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e) {
    e.preventDefault()
    setLoading(true)
    let emailFinal = usuario.trim().toLowerCase()
    if (!emailFinal.includes('@')) emailFinal = `${emailFinal}@dojo.com`
    const { error } = await supabase.auth.signInWithPassword({ email: emailFinal, password })
    if (error) toast.error("Credenciales incorrectas")
    else toast.success("¡Bienvenido al Dojo!")
    setLoading(false)
  }

  const styles = {
    container: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f8fafc', fontFamily: 'sans-serif', margin: 0 },
    card: { background: 'white', padding: '40px', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', width: '90%', maxWidth: '350px', textAlign: 'center', boxSizing: 'border-box' },
    input: { width: '100%', padding: '12px', margin: '8px 0', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing:'border-box', fontSize: '16px' },
    btn: { width: '100%', padding: '12px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', marginTop:'10px' }
  }

  return (
    <div style={styles.container}>
      <Toaster richColors position="top-center" />
      <div style={styles.card}>
        <div style={{ fontSize: '40px', marginBottom: '10px' }}>🥋</div>
        <h1 style={{ fontSize: '24px', color: '#1e293b', margin: '0 0 20px 0' }}>DojoPay</h1>
        <form onSubmit={handleLogin}>
          <input type="text" placeholder="Usuario" value={usuario} onChange={e => setUsuario(e.target.value)} style={styles.input} autoCapitalize="none" required />
          <input type="password" placeholder="Contraseña" value={password} onChange={e => setPassword(e.target.value)} style={styles.input} required />
          <button type="submit" disabled={loading} style={styles.btn}>{loading ? 'Entrando...' : 'INICIAR SESIÓN'}</button>
        </form>
      </div>
    </div>
  )
}

// --- DASHBOARD ---
function Dashboard({ session, rolUsuario }) {
  const [vistaActual, setVistaActual] = useState('inicio')
  const [alumnos, setAlumnos] = useState([])
  const [loading, setLoading] = useState(true)
  const [metricas, setMetricas] = useState({ totalDeuda: 0, totalAlumnos: 0, ingresosMes: 0 })
  const [datosGrafica, setDatosGrafica] = useState([])
  const [busqueda, setBusqueda] = useState('')
  
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [modoEdicion, setModoEdicion] = useState(false)
  const [idEdicion, setIdEdicion] = useState(null)
  const [nombre, setNombre] = useState(''); const [telefono, setTelefono] = useState(''); const [cinta, setCinta] = useState('Blanca'); const [monto, setMonto] = useState(600); const [archivoFoto, setArchivoFoto] = useState(null); const [fotoPreview, setFotoPreview] = useState(null)

  useEffect(() => { fetchDatos() }, [])

  async function fetchDatos() {
    setLoading(true)
    try {
      const { data: alumnosData } = await supabase.from('alumnos').select('*').eq('activo', true).order('nombre')
      const hoy = new Date()
      const primerDiaMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString()
      const seisMesesAtras = new Date()
      seisMesesAtras.setMonth(seisMesesAtras.getMonth() - 5)
      seisMesesAtras.setDate(1)
      const { data: pagosRaw } = await supabase.from('pagos').select('monto, alumno_id, fecha_pago').gte('fecha_pago', seisMesesAtras.toISOString())

      let deuda = 0, ingresos = 0
      const pagosEsteMes = pagosRaw.filter(p => new Date(p.fecha_pago) >= new Date(primerDiaMes))
      pagosEsteMes.forEach(p => ingresos += p.monto)

      const alumnosProcesados = alumnosData.map(alumno => {
        const yaPago = pagosEsteMes.some(pago => pago.alumno_id === alumno.id)
        if (!yaPago) deuda += alumno.monto_mensualidad
        return { ...alumno, pagado: yaPago }
      })

      setAlumnos(alumnosProcesados)
      setMetricas({ totalAlumnos: alumnosData.length, totalDeuda: deuda, ingresosMes: ingresos })

      const mapaMeses = {}
      for (let i = 5; i >= 0; i--) {
        const d = new Date()
        d.setMonth(d.getMonth() - i)
        mapaMeses[d.toLocaleString('es-ES', { month: 'short' }).toUpperCase()] = 0
      }
      pagosRaw.forEach(p => {
        const key = new Date(p.fecha_pago).toLocaleString('es-ES', { month: 'short' }).toUpperCase()
        if (mapaMeses[key] !== undefined) mapaMeses[key] += p.monto
      })
      setDatosGrafica(Object.keys(mapaMeses).map(key => ({ name: key, total: mapaMeses[key] })))
    } catch (error) { toast.error('Error cargando datos') } 
    finally { setLoading(false) }
  }

  async function subirFoto() {
    if (!archivoFoto) return null
    const ext = archivoFoto.name.split('.').pop()
    const fileName = `${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('avatars').upload(fileName, archivoFoto)
    if (error) throw error
    const { data } = supabase.storage.from('avatars').getPublicUrl(fileName)
    return data.publicUrl
  }

  function abrirFormularioCrear() { setModoEdicion(false); setNombre(''); setTelefono(''); setCinta('Blanca'); setMonto(600); setArchivoFoto(null); setFotoPreview(null); setMostrarFormulario(true) }
  function abrirFormularioEditar(a) { setModoEdicion(true); setIdEdicion(a.id); setNombre(a.nombre); setTelefono(a.telefono||''); setCinta(a.cinta); setMonto(a.monto_mensualidad); setArchivoFoto(null); setFotoPreview(a.foto_url); setMostrarFormulario(true) }

  async function guardarAlumno(e) {
    e.preventDefault()
    const guardarPromesa = async () => {
      let urlFinal = fotoPreview
      if (archivoFoto) urlFinal = await subirFoto()
      const datos = { nombre, telefono, cinta, monto_mensualidad: monto, activo: true, foto_url: urlFinal }
      const { error } = modoEdicion ? await supabase.from('alumnos').update(datos).eq('id', idEdicion) : await supabase.from('alumnos').insert([datos])
      if (error) throw error
      setMostrarFormulario(false); fetchDatos()
    }
    toast.promise(guardarPromesa(), { loading: 'Guardando...', success: '¡Guardado!', error: 'Error' })
  }

  function confirmarPago(id, monto) {
    toast(`¿Cobrar $${monto}?`, {
      action: { label: "CONFIRMAR", onClick: async () => { const { error } = await supabase.from('pagos').insert([{alumno_id:id, monto}]); if (!error) { fetchDatos(); toast.success(`Pago registrado`) } } }
    })
  }
  
  function enviarWhatsApp(tel, nom, monto) { 
    if(tel) window.open(`https://wa.me/${tel}?text=Hola ${nom}, tu pago vence hoy.`, '_blank')
    else toast.warning("Sin teléfono")
  }
  
  async function cerrarSesion() { await supabase.auth.signOut() }
  const getIniciales = (n) => n.split(' ').map(c=>c[0]).join('').substring(0,2).toUpperCase()
  
  const listaParaMostrar = vistaActual === 'inicio' 
    ? alumnos.filter(a => !a.pagado) 
    : alumnos.filter(a => a.nombre.toLowerCase().includes(busqueda.toLowerCase()))

  // --- VARIABLES DE DISEÑO (AJUSTADAS) ---
  const APP_WIDTH = '1200px'; // AUMENTADO A 1200px para que se vea grande en PC

  const styles = {
    // 1. Contenedor Maestro
    appContainer: {
      background: '#f8fafc',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center', 
    },

    // 2. Top Bar
    topBar: {
      background: 'white',
      padding: '15px 20px',
      position: 'sticky',
      top: 0,
      zIndex: 50,
      borderBottom: '1px solid #f1f5f9',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      width: '100%',
      maxWidth: APP_WIDTH, 
      boxSizing: 'border-box'
    },

    // 3. Contenido (Con menos padding para aprovechar espacio)
    content: {
      width: '100%',
      maxWidth: APP_WIDTH,
      padding: '16px', // Reducido ligeramente para ganar espacio en móvil
      paddingBottom: '100px', 
      boxSizing: 'border-box'
    },

    // 4. Barra Inferior
    bottomBar: {
      position: 'fixed',
      bottom: 0,
      left: '50%',
      transform: 'translateX(-50%)', 
      width: '100%',
      maxWidth: APP_WIDTH, 
      background: 'white',
      borderTop: '1px solid #e2e8f0',
      padding: '12px 0',
      display: 'flex',
      justifyContent: 'space-around',
      alignItems: 'center',
      zIndex: 100,
      paddingBottom: 'max(12px, env(safe-area-inset-bottom))',
      boxShadow: '0 -4px 6px -1px rgba(0,0,0,0.05)'
    },

    // ELEMENTOS INTERNOS
    statContainer: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', marginBottom: '20px', width: '100%' },
    statBox: { background: 'white', padding: '15px 10px', borderRadius: '16px', textAlign: 'center', border: '1px solid #f1f5f9', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' },
    
    card: { background: 'white', borderRadius: '16px', padding: '15px', marginBottom: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.03)', display: 'flex', alignItems: 'center', gap: '15px', border: '1px solid #f1f5f9', width: '100%', boxSizing: 'border-box' },
    avatar: { width: '48px', height: '48px', borderRadius: '50%', color: 'white', display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 'bold', fontSize: '16px', flexShrink: 0, objectFit: 'cover' },
    search: { width: '100%', padding: '16px', marginBottom: '20px', borderRadius: '16px', border: '1px solid #e2e8f0', fontSize: '15px', outline: 'none', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', boxSizing: 'border-box' },
    chartContainer: { background: 'white', padding: '15px', borderRadius: '16px', marginBottom: '25px', border: '1px solid #f1f5f9', height: '300px', width: '100%', boxSizing: 'border-box' },
    
    // Botón flotante inteligente
    btnFloat: { position:'fixed', bottom:'90px', right:'calc(50% - ' + (parseInt(APP_WIDTH)/2 - 20) + 'px)', background:'#3b82f6', color:'white', width:'56px', height:'56px', borderRadius:'50%', border:'none', fontSize:'24px', boxShadow:'0 4px 12px rgba(59,130,246,0.4)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', zIndex:50 },
    btnFloatMobile: { position:'fixed', bottom:'90px', right:'20px', background:'#3b82f6', color:'white', width:'56px', height:'56px', borderRadius:'50%', border:'none', fontSize:'24px', boxShadow:'0 4px 12px rgba(59,130,246,0.4)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', zIndex:50 },
    
    navItem: { display:'flex', flexDirection:'column', alignItems:'center', gap:'4px', background:'none', border:'none', fontSize:'10px', fontWeight:'600', cursor:'pointer' },
    fileInput: { marginBottom: '15px', fontSize: '12px', width: '100%' }
  }

  // Detectar si es pantalla ancha para el botón flotante
  const isDesktop = typeof window !== 'undefined' && window.innerWidth > 1200;

  return (
    <div style={styles.appContainer}>
      <Toaster richColors position="top-center" />
      
      {/* TOP BAR */}
      <div style={styles.topBar}>
        <div style={{ fontWeight: '800', fontSize: '18px', color: '#1e293b' }}>
          {vistaActual === 'inicio' ? 'Resumen' : 'Directorio'}
        </div>
        <button onClick={cerrarSesion} style={{ background: '#fee2e2', border: 'none', padding: '8px', borderRadius: '8px', cursor: 'pointer' }}>
          <IconLogout />
        </button>
      </div>

      {/* CONTENIDO */}
      <div style={styles.content}>
        
        {/* --- VISTA: INICIO --- */}
        {vistaActual === 'inicio' && (
          <>
            {rolUsuario === 'admin' && (
              <>
                <div style={styles.statContainer}>
                  <div style={styles.statBox}><div style={{fontSize:'20px', fontWeight:'800', color:'#ef4444'}}>${metricas.totalDeuda}</div><div style={{fontSize:'10px', color:'#94a3b8', fontWeight:'700'}}>DEUDA</div></div>
                  <div style={styles.statBox}><div style={{fontSize:'20px', fontWeight:'800', color:'#10b981'}}>${metricas.ingresosMes}</div><div style={{fontSize:'10px', color:'#94a3b8', fontWeight:'700'}}>INGRESOS</div></div>
                  <div style={styles.statBox}><div style={{fontSize:'20px', fontWeight:'800', color:'#3b82f6'}}>{metricas.totalAlumnos}</div><div style={{fontSize:'10px', color:'#94a3b8', fontWeight:'700'}}>ALUMNOS</div></div>
                </div>
                
                <div style={styles.chartContainer}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={datosGrafica}><Bar dataKey="total" fill="#3b82f6" radius={[4,4,4,4]} /><XAxis dataKey="name" hide /></BarChart>
                  </ResponsiveContainer>
                </div>
              </>
            )}

            <h3 style={{ margin: '0 0 15px 0', fontSize: '14px', color: '#64748b', textTransform:'uppercase', letterSpacing:'1px' }}>Pendientes ({listaParaMostrar.length})</h3>
            
            {listaParaMostrar.length === 0 ? (
              <div style={{textAlign:'center', padding:'40px', color:'#94a3b8'}}>
                <div style={{fontSize:'40px'}}>🎉</div>
                <p>¡Todo al día!</p>
              </div>
            ) : (
              listaParaMostrar.map((a) => (
                <div key={a.id} style={{...styles.card, borderLeft: '4px solid #ef4444'}}>
                  {a.foto_url ? <img src={a.foto_url} style={{...styles.avatar, background:'transparent'}} /> : <div style={{...styles.avatar, background:'#ef4444'}}>{getIniciales(a.nombre)}</div>}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '700', color: '#1e293b' }}>{a.nombre}</div>
                    <div style={{fontSize:'12px', color:'#64748b'}}>Debe: ${a.monto_mensualidad}</div>
                  </div>
                  <div style={{display:'flex', gap:'8px'}}>
                    <button onClick={() => confirmarPago(a.id, a.monto_mensualidad)} style={{background:'#eff6ff', color:'#3b82f6', border:'none', padding:'8px 12px', borderRadius:'8px', fontWeight:'700', fontSize:'12px'}}>COBRAR</button>
                    <button onClick={() => enviarWhatsApp(a.telefono, a.nombre, a.monto_mensualidad)} style={{background:'#f0fdf4', color:'#16a34a', border:'none', padding:'8px', borderRadius:'8px'}}>💬</button>
                  </div>
                </div>
              ))
            )}
          </>
        )}

        {/* --- VISTA: ALUMNOS --- */}
        {vistaActual === 'alumnos' && (
          <>
            <input placeholder="Buscar alumno..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} style={styles.search} />
            
            {listaParaMostrar.map((a) => (
              <div key={a.id} style={styles.card} onClick={() => abrirFormularioEditar(a)}>
                {a.foto_url ? <img src={a.foto_url} style={{...styles.avatar, background:'transparent'}} /> : <div style={{...styles.avatar, background: a.pagado ? '#10b981' : '#ef4444'}}>{getIniciales(a.nombre)}</div>}
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '700', color: '#1e293b' }}>{a.nombre}</div>
                  <div style={{fontSize:'12px', color:'#64748b'}}>{a.cinta} • {a.pagado ? <span style={{color:'#10b981'}}>Al corriente</span> : <span style={{color:'#ef4444'}}>Debe pago</span>}</div>
                </div>
                <div style={{fontSize:'20px', color:'#cbd5e1'}}>›</div>
              </div>
            ))}
            
            {/* Botón Flotante */}
            <button onClick={abrirFormularioCrear} style={isDesktop ? styles.btnFloat : styles.btnFloatMobile}>+</button>
          </>
        )}

      </div>

      <div style={styles.bottomBar}>
        <button onClick={() => setVistaActual('inicio')} style={{...styles.navItem, color: vistaActual === 'inicio' ? '#3b82f6' : '#94a3b8'}}>
          <IconHome active={vistaActual === 'inicio'} /> INICIO
        </button>
        <button onClick={() => setVistaActual('alumnos')} style={{...styles.navItem, color: vistaActual === 'alumnos' ? '#3b82f6' : '#94a3b8'}}>
          <IconUsers active={vistaActual === 'alumnos'} /> ALUMNOS
        </button>
      </div>

      {mostrarFormulario && (
        <div style={{ position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.5)', display:'flex', justifyContent:'center', alignItems:'center', zIndex:200 }}>
          <div style={{ background:'white', padding:'25px', borderRadius:'16px', width:'90%', maxWidth:'400px' }}>
            <h2 style={{marginTop:0, fontSize:'18px'}}>{modoEdicion?'Editar':'Nuevo'}</h2>
            <form onSubmit={guardarAlumno}>
              <div style={{textAlign:'center', marginBottom:'15px'}}>
                <div style={{width:'80px', height:'80px', borderRadius:'50%', background:'#f1f5f9', margin:'0 auto 10px', display:'flex', justifyContent:'center', alignItems:'center', overflow:'hidden', border:'1px solid #e2e8f0'}}>
                  {fotoPreview || archivoFoto ? <img src={archivoFoto ? URL.createObjectURL(archivoFoto) : fotoPreview} style={{width:'100%', height:'100%', objectFit:'cover'}} /> : <span style={{fontSize:'30px'}}>📷</span>}
                </div>
                <input type="file" accept="image/*" onChange={e => setArchivoFoto(e.target.files[0])} style={{fontSize:'12px'}} />
              </div>
              <input style={styles.search} placeholder="Nombre" value={nombre} onChange={e=>setNombre(e.target.value)} required />
              <input style={styles.search} placeholder="Teléfono" value={telefono} onChange={e=>setTelefono(e.target.value)} type="number" />
              <div style={{display:'flex', gap:'10px'}}>
                <select style={styles.search} value={cinta} onChange={e=>setCinta(e.target.value)}>{['Blanca','Amarilla','Verde','Azul','Roja','Negra'].map(c=><option key={c}>{c}</option>)}</select>
                <input style={styles.search} placeholder="$" value={monto} onChange={e=>setMonto(e.target.value)} type="number" />
              </div>
              <div style={{display:'flex', gap:'10px', marginTop:'10px'}}>
                <button type="button" onClick={()=>setMostrarFormulario(false)} style={{flex:1, padding:'10px', background:'#fee2e2', color:'#ef4444', border:'none', borderRadius:'8px', cursor:'pointer', fontWeight:'bold'}}>CANCELAR</button>
                <button type="submit" style={{flex:1, padding:'10px', background:'#3b82f6', color:'white', border:'none', borderRadius:'8px', cursor:'pointer', fontWeight:'bold'}}>GUARDAR</button>
              </div>
              {modoEdicion && rolUsuario === 'admin' && <button type="button" onClick={() => {if(confirm("¿Baja?")) {supabase.from('alumnos').update({activo:false}).eq('id', idEdicion).then(() => {setMostrarFormulario(false);fetchDatos()})}}} style={{width:'100%', marginTop:'15px', background:'none', border:'none', color:'#ef4444', fontSize:'11px', cursor:'pointer'}}>ELIMINAR</button>}
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

function App() {
  const [session, setSession] = useState(null)
  const [rol, setRol] = useState(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => { setSession(session); if (session) cargarPerfil(session.user.id); else setLoading(false) })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => { setSession(session); if (session) cargarPerfil(session.user.id); else { setRol(null); setLoading(false) } })
    return () => subscription.unsubscribe()
  }, [])
  async function cargarPerfil(uid) { const { data } = await supabase.from('perfiles').select('rol').eq('id', uid).single(); setRol(data?.rol || 'entrenador'); setLoading(false) }
  if (loading) return <div style={{display:'flex', justifyContent:'center', alignItems:'center', height:'100vh'}}>Cargando...</div>
  if (!session) return <LoginScreen />
  return <Dashboard session={session} rolUsuario={rol} />
}

export default App
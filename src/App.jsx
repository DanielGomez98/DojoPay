import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { Toaster, toast } from 'sonner'

// --- LOGIN SCREEN ---
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
    container: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f8fafc', fontFamily: 'sans-serif' },
    card: { background: 'white', padding: '40px', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', width: '100%', maxWidth: '350px', textAlign: 'center' },
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
  const [alumnos, setAlumnos] = useState([])
  const [historial, setHistorial] = useState([])
  const [loading, setLoading] = useState(true)
  const [metricas, setMetricas] = useState({ totalDeuda: 0, totalAlumnos: 0, ingresosMes: 0 })
  const [datosGrafica, setDatosGrafica] = useState([])
  const [busqueda, setBusqueda] = useState('')
  
  // Estados Formulario
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [modoEdicion, setModoEdicion] = useState(false)
  const [idEdicion, setIdEdicion] = useState(null)
  
  // Campos
  const [nombre, setNombre] = useState('')
  const [telefono, setTelefono] = useState('')
  const [cinta, setCinta] = useState('Blanca')
  const [monto, setMonto] = useState(600)
  const [archivoFoto, setArchivoFoto] = useState(null) // Nuevo estado para el archivo
  const [fotoPreview, setFotoPreview] = useState(null) // Para mostrar la foto actual

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
      const { data: ultimosPagos } = await supabase.from('pagos').select('id, monto, fecha_pago, alumnos(nombre)').order('fecha_pago', { ascending: false }).limit(10)

      setHistorial(ultimosPagos || [])

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

  // --- LÓGICA DE FOTOS ---
  async function subirFoto() {
    if (!archivoFoto) return null
    const ext = archivoFoto.name.split('.').pop()
    const fileName = `${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('avatars').upload(fileName, archivoFoto)
    if (error) throw error
    const { data } = supabase.storage.from('avatars').getPublicUrl(fileName)
    return data.publicUrl
  }

  // --- CRUD ---
  function abrirFormularioCrear() { 
    setModoEdicion(false); setNombre(''); setTelefono(''); setCinta('Blanca'); setMonto(600); setArchivoFoto(null); setFotoPreview(null);
    setMostrarFormulario(true) 
  }
  function abrirFormularioEditar(a) { 
    setModoEdicion(true); setIdEdicion(a.id); setNombre(a.nombre); setTelefono(a.telefono||''); setCinta(a.cinta); setMonto(a.monto_mensualidad); setArchivoFoto(null); setFotoPreview(a.foto_url);
    setMostrarFormulario(true) 
  }

  async function guardarAlumno(e) {
    e.preventDefault()
    
    const guardarPromesa = async () => {
      let urlFinal = fotoPreview
      
      // 1. Si hay archivo nuevo, subirlo
      if (archivoFoto) {
        urlFinal = await subirFoto()
      }

      const datos = { nombre, telefono, cinta, monto_mensualidad: monto, activo: true, foto_url: urlFinal }
      
      // 2. Guardar en base de datos
      const { error } = modoEdicion ? await supabase.from('alumnos').update(datos).eq('id', idEdicion) : await supabase.from('alumnos').insert([datos])
      if (error) throw error
      
      setMostrarFormulario(false)
      fetchDatos()
    }

    toast.promise(guardarPromesa(), {
      loading: 'Guardando datos y foto...',
      success: '¡Alumno guardado!',
      error: (err) => `Error: ${err.message}`
    })
  }

  function confirmarBaja() {
    toast("¿Dar de baja?", {
      action: {
        label: "Sí, Borrar",
        onClick: async () => {
          await supabase.from('alumnos').update({activo:false}).eq('id', idEdicion)
          setMostrarFormulario(false); fetchDatos(); toast.success("Alumno dado de baja")
        }
      }
    })
  }

  function confirmarPago(id, monto) {
    toast(`¿Cobrar $${monto}?`, {
      action: {
        label: "CONFIRMAR",
        onClick: async () => {
          const { error } = await supabase.from('pagos').insert([{alumno_id:id, monto}])
          if (!error) { fetchDatos(); toast.success(`Pago registrado`) }
        }
      }
    })
  }
  
  function enviarWhatsApp(tel, nom, monto) { 
    if(tel) window.open(`https://wa.me/${tel}?text=Hola ${nom}, tu pago vence hoy.`, '_blank')
    else toast.warning("Sin teléfono")
  }
  
  async function cerrarSesion() { await supabase.auth.signOut() }
  const getIniciales = (n) => n.split(' ').map(c=>c[0]).join('').substring(0,2).toUpperCase()
  const alumnosFiltrados = alumnos.filter(a => a.nombre.toLowerCase().includes(busqueda.toLowerCase()))
  
  const styles = {
    layout: { display: 'flex', flexWrap: 'wrap', gap: '25px', maxWidth: '1200px', margin: '0 auto', padding: '20px', alignItems: 'flex-start' },
    colMain: { flex: '2 1 500px' }, colSide: { flex: '1 1 300px' },
    card: { background: 'white', borderRadius: '12px', padding: '16px', marginBottom: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: '15px', border: '1px solid #f1f5f9' },
    avatar: { width: '48px', height: '48px', borderRadius: '50%', color: 'white', display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 'bold', fontSize: '16px', flexShrink: 0, objectFit: 'cover', border: '2px solid white', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' },
    search: { width: '100%', padding: '14px', marginBottom:'20px', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '15px', outline: 'none', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', boxSizing:'border-box' },
    btnPill: { padding: '6px 14px', borderRadius: '20px', border: 'none', cursor: 'pointer', fontSize: '11px', fontWeight: '700', transition: 'all 0.2s', textTransform: 'uppercase' },
    btnNav: { background: '#3b82f6', color: 'white', border: 'none', padding: '8px 18px', borderRadius: '6px', fontWeight: '600', cursor: 'pointer', fontSize: '13px' },
    statBox: { background: 'white', padding: '20px', borderRadius: '16px', flex: 1, boxShadow: '0 2px 4px rgba(0,0,0,0.04)', textAlign: 'center', border: '1px solid #f1f5f9' },
    chartContainer: { background: 'white', padding: '20px', borderRadius: '16px', marginBottom: '25px', boxShadow: '0 2px 4px rgba(0,0,0,0.04)', border: '1px solid #f1f5f9', height: '300px' },
    fileInput: { marginBottom: '15px', fontSize: '12px' }
  }

  return (
    <div style={{ fontFamily: '"Inter", sans-serif', background: '#f8fafc', minHeight: '100vh', color: '#334155', paddingBottom:'50px' }}>
      <Toaster richColors position="bottom-right" />
      <nav style={{ background: '#1e293b', padding: '15px 0', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ color: 'white', fontWeight: 'bold', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>🥋</span> DojoPay <span style={{fontSize:'10px', background: rolUsuario === 'admin' ? '#ef4444' : '#3b82f6', padding:'2px 6px', borderRadius:'4px'}}>{rolUsuario?.toUpperCase()}</span>
          </div>
          <div style={{display:'flex', gap:'10px'}}>
            <button onClick={cerrarSesion} style={{ background: 'none', border: '1px solid #475569', color: '#cbd5e1', padding: '8px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>Salir</button>
            <button onClick={abrirFormularioCrear} style={styles.btnNav}>+ NUEVO</button>
          </div>
        </div>
      </nav>

      <div style={styles.layout}>
        <div style={styles.colMain}>
          {rolUsuario === 'admin' && (
            <>
              <div style={{ display: 'flex', gap: '15px', marginBottom: '25px' }}>
                <div style={styles.statBox}><div style={{fontSize:'24px', fontWeight:'800', color:'#0f172a'}}>{metricas.totalAlumnos}</div><div style={{fontSize:'10px', color:'#64748b', fontWeight:'700'}}>ALUMNOS</div></div>
                <div style={styles.statBox}><div style={{fontSize:'24px', fontWeight:'800', color:'#ef4444'}}>${metricas.totalDeuda}</div><div style={{fontSize:'10px', color:'#ef4444', fontWeight:'700'}}>POR COBRAR</div></div>
                <div style={styles.statBox}><div style={{fontSize:'24px', fontWeight:'800', color:'#10b981'}}>${metricas.ingresosMes}</div><div style={{fontSize:'10px', color:'#10b981', fontWeight:'700'}}>MES ACTUAL</div></div>
              </div>
              <div style={styles.chartContainer}>
                <h3 style={{ margin: '0 0 20px 0', fontSize: '14px', color: '#0f172a', fontWeight: '700' }}>INGRESOS SEMESTRALES</h3>
                <ResponsiveContainer width="100%" height="85%">
                  <BarChart data={datosGrafica}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" /><XAxis dataKey="name" tick={{fontSize:12}} axisLine={false} tickLine={false} /><YAxis tick={{fontSize:12}} axisLine={false} tickLine={false} tickFormatter={(v)=>`$${v}`} /><Tooltip cursor={{fill:'#f1f5f9'}} /><Bar dataKey="total" fill="#3b82f6" radius={[4,4,0,0]} barSize={40} /></BarChart>
                </ResponsiveContainer>
              </div>
            </>
          )}

          <input placeholder="Buscar alumno..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} style={styles.search} />
          
          {loading ? <p>Cargando...</p> : (
            <div>
              {alumnosFiltrados.map((a) => (
                <div key={a.id} style={styles.card}>
                  {/* AVATAR INTELIGENTE: Foto o Iniciales */}
                  {a.foto_url ? (
                    <img src={a.foto_url} alt={a.nombre} style={{ ...styles.avatar, background: 'transparent' }} />
                  ) : (
                    <div style={{ ...styles.avatar, background: a.pagado ? '#10b981' : '#f43f5e' }}>{getIniciales(a.nombre)}</div>
                  )}
                  
                  <div style={{ flex: 1, cursor: 'pointer' }} onClick={() => abrirFormularioEditar(a)}>
                    <div style={{ fontWeight: '600', fontSize: '15px', color: '#1e293b' }}>{a.nombre} <span style={{fontSize:'11px', color:'#94a3b8', fontWeight:'normal'}}>(Editar)</span></div>
                    <div style={{fontSize:'13px', color:'#64748b'}}>{a.cinta} • ${a.monto_mensualidad}</div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {!a.pagado ? (
                      <>
                        <button onClick={() => confirmarPago(a.id, a.monto_mensualidad)} style={{ ...styles.btnPill, background: '#eff6ff', color: '#2563eb' }}>Cobrar</button>
                        <button onClick={() => enviarWhatsApp(a.telefono, a.nombre, a.monto_mensualidad)} style={{ ...styles.btnPill, background: '#f0fdf4', color: '#16a34a' }}>WhatsApp</button>
                      </>
                    ) : <span style={{ color: '#10b981', fontWeight: 'bold', fontSize: '11px', background: '#dcfce7', padding: '6px 12px', borderRadius: '20px' }}>PAGADO</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div style={styles.colSide}>
           <div style={{ background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', position: 'sticky', top: '90px', border: '1px solid #f1f5f9' }}>
            <h3 style={{ margin: '0 0 15px 0', fontSize: '12px', color: '#0f172a', fontWeight: '800', textTransform: 'uppercase' }}>Actividad Reciente</h3>
            {historial.map(p => (
              <div key={p.id} style={{ padding: '12px', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <div><div style={{ fontWeight: '500' }}>{p.alumnos?.nombre}</div><div style={{ fontSize: '11px', color: '#94a3b8' }}>{new Date(p.fecha_pago).toLocaleDateString()}</div></div>
                <div style={{ color: '#10b981', fontWeight: '600' }}>+${p.monto}</div>
              </div>
            ))}
            <div style={{ marginTop: '15px', textAlign: 'center' }}>
              <button onClick={fetchDatos} style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', fontSize: '12px', fontWeight: '700' }}>ACTUALIZAR</button>
            </div>
          </div>
        </div>
      </div>

      {mostrarFormulario && (
        <div style={{ position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.5)', display:'flex', justifyContent:'center', alignItems:'center', zIndex:200 }}>
          <div style={{ background:'white', padding:'25px', borderRadius:'16px', width:'90%', maxWidth:'400px' }}>
            <h2 style={{marginTop:0, fontSize:'18px'}}>{modoEdicion?'Editar':'Nuevo'}</h2>
            <form onSubmit={guardarAlumno}>
              <div style={{textAlign:'center', marginBottom:'15px'}}>
                {/* PREVISUALIZACIÓN DE FOTO */}
                <div style={{width:'80px', height:'80px', borderRadius:'50%', background:'#f1f5f9', margin:'0 auto 10px', display:'flex', justifyContent:'center', alignItems:'center', overflow:'hidden', border:'1px solid #e2e8f0'}}>
                  {fotoPreview || archivoFoto ? (
                    <img src={archivoFoto ? URL.createObjectURL(archivoFoto) : fotoPreview} style={{width:'100%', height:'100%', objectFit:'cover'}} />
                  ) : <span style={{fontSize:'30px'}}>📷</span>}
                </div>
                {/* INPUT DE FOTO */}
                <input type="file" accept="image/*" onChange={e => setArchivoFoto(e.target.files[0])} style={styles.fileInput} />
              </div>

              <input style={styles.search} placeholder="Nombre" value={nombre} onChange={e=>setNombre(e.target.value)} required />
              <input style={styles.search} placeholder="Teléfono" value={telefono} onChange={e=>setTelefono(e.target.value)} type="number" />
              <div style={{display:'flex', gap:'10px'}}>
                <select style={styles.search} value={cinta} onChange={e=>setCinta(e.target.value)}>{['Blanca','Amarilla','Verde','Azul','Roja','Negra'].map(c=><option key={c}>{c}</option>)}</select>
                <input style={styles.search} placeholder="$" value={monto} onChange={e=>setMonto(e.target.value)} type="number" />
              </div>
              <div style={{display:'flex', gap:'10px', marginTop:'10px'}}>
                <button type="button" onClick={()=>setMostrarFormulario(false)} style={{flex:1, padding:'10px', background:'#f1f5f9', border:'none', borderRadius:'8px', cursor:'pointer'}}>Cancelar</button>
                <button type="submit" style={{flex:1, padding:'10px', background:'#3b82f6', color:'white', border:'none', borderRadius:'8px', cursor:'pointer'}}>Guardar</button>
              </div>
              {modoEdicion && rolUsuario === 'admin' && <button type="button" onClick={confirmarBaja} style={{width:'100%', marginTop:'15px', background:'none', border:'none', color:'#ef4444', fontSize:'11px', cursor:'pointer'}}>ELIMINAR ALUMNO</button>}
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
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) cargarPerfil(session.user.id)
      else setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) cargarPerfil(session.user.id)
      else { setRol(null); setLoading(false) }
    })
    return () => subscription.unsubscribe()
  }, [])

  async function cargarPerfil(uid) {
    const { data } = await supabase.from('perfiles').select('rol').eq('id', uid).single()
    setRol(data?.rol || 'entrenador') 
    setLoading(false)
  }

  if (loading) return <div style={{display:'flex', justifyContent:'center', alignItems:'center', height:'100vh'}}>Cargando...</div>
  if (!session) return <LoginScreen />
  return <Dashboard session={session} rolUsuario={rol} />
}

export default App
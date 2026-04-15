import { useEffect, useRef } from 'react'
import { useTheme } from '../context/ThemeContext'

export default function RoboticCanvas() {
  const canvasRef = useRef(null)
  const { dark } = useTheme()

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    let animId

    const resize = () => {
      canvas.width  = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    if (dark) {
      // ── DARK MODE: Electric Constellation + Nebula ──────────

      const bgStars = Array.from({ length: 250 }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 1.5 + 0.3,
        twinkle: Math.random() * Math.PI * 2,
        speed: 0.008 + Math.random() * 0.02,
        hue: 200 + Math.random() * 60,
      }))

      const stars = Array.from({ length: 90 }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.2,
        vy: (Math.random() - 0.5) * 0.2,
        r: Math.random() * 2.5 + 1,
        pulse: Math.random() * Math.PI * 2,
        brightness: 0.6 + Math.random() * 0.4,
        hue: 200 + Math.random() * 60,
      }))

      const nebulas = Array.from({ length: 5 }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: 150 + Math.random() * 200,
        hue: 200 + Math.random() * 80,
        pulse: Math.random() * Math.PI * 2,
        vx: (Math.random() - 0.5) * 0.1,
        vy: (Math.random() - 0.5) * 0.1,
      }))

      const shootingStars = Array.from({ length: 4 }, () => ({
        x: 0, y: 0, len: 0, speed: 0, alpha: 0,
        active: false, timer: Math.random() * 150,
      }))

      const draw = () => {
        ctx.fillStyle = '#020817'
        ctx.fillRect(0, 0, canvas.width, canvas.height)

        // Nebulas
        nebulas.forEach(n => {
          n.x += n.vx; n.y += n.vy; n.pulse += 0.005
          if (n.x < -n.r || n.x > canvas.width + n.r)  n.vx *= -1
          if (n.y < -n.r || n.y > canvas.height + n.r) n.vy *= -1
          const pr = n.r + Math.sin(n.pulse) * 30
          const gn = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, pr)
          gn.addColorStop(0,   `hsla(${n.hue}, 100%, 60%, 0.07)`)
          gn.addColorStop(0.5, `hsla(${n.hue + 30}, 90%, 50%, 0.04)`)
          gn.addColorStop(1,   `hsla(${n.hue + 60}, 80%, 40%, 0)`)
          ctx.beginPath()
          ctx.arc(n.x, n.y, pr, 0, Math.PI * 2)
          ctx.fillStyle = gn
          ctx.fill()
        })

        // Background stars
        bgStars.forEach(s => {
          s.twinkle += s.speed
          const a = 0.3 + 0.7 * Math.abs(Math.sin(s.twinkle))
          ctx.beginPath()
          ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2)
          ctx.fillStyle = `hsla(${s.hue}, 80%, 90%, ${a})`
          ctx.fill()
        })

        // Shooting stars
        shootingStars.forEach(ss => {
          if (!ss.active) {
            ss.timer--
            if (ss.timer <= 0) {
              ss.active = true
              ss.x = Math.random() * canvas.width * 0.7
              ss.y = Math.random() * canvas.height * 0.4
              ss.len = 100 + Math.random() * 150
              ss.speed = 10 + Math.random() * 8
              ss.alpha = 1
              ss.timer = 120 + Math.random() * 180
            }
          } else {
            ss.x += ss.speed; ss.y += ss.speed * 0.45
            ss.alpha -= 0.025
            if (ss.alpha <= 0) ss.active = false
            const gs = ctx.createLinearGradient(ss.x, ss.y, ss.x - ss.len, ss.y - ss.len * 0.45)
            gs.addColorStop(0,   `rgba(255,255,255,${ss.alpha})`)
            gs.addColorStop(0.3, `rgba(180,220,255,${ss.alpha * 0.6})`)
            gs.addColorStop(1,   `rgba(100,180,255,0)`)
            ctx.beginPath()
            ctx.moveTo(ss.x, ss.y)
            ctx.lineTo(ss.x - ss.len, ss.y - ss.len * 0.45)
            ctx.strokeStyle = gs
            ctx.lineWidth = 2
            ctx.stroke()
          }
        })

        // Move constellation stars
        stars.forEach(s => {
          s.x += s.vx; s.y += s.vy; s.pulse += 0.025
          if (s.x < 0 || s.x > canvas.width)  s.vx *= -1
          if (s.y < 0 || s.y > canvas.height) s.vy *= -1
        })

        // Constellation lines
        for (let i = 0; i < stars.length; i++) {
          for (let j = i + 1; j < stars.length; j++) {
            const dx = stars[i].x - stars[j].x
            const dy = stars[i].y - stars[j].y
            const dist = Math.sqrt(dx * dx + dy * dy)
            if (dist < 160) {
              const alpha = (1 - dist / 160) * 0.4
              const hue = (stars[i].hue + stars[j].hue) / 2
              ctx.beginPath()
              ctx.moveTo(stars[i].x, stars[i].y)
              ctx.lineTo(stars[j].x, stars[j].y)
              ctx.strokeStyle = `hsla(${hue}, 100%, 75%, ${alpha})`
              ctx.lineWidth = 0.7
              ctx.stroke()
            }
          }
        }

        // Glowing stars
        stars.forEach(s => {
          const glow = 0.6 + 0.4 * Math.sin(s.pulse)
          const g = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r * 5)
          g.addColorStop(0, `hsla(${s.hue}, 100%, 80%, ${glow * 0.5 * s.brightness})`)
          g.addColorStop(1, `hsla(${s.hue}, 100%, 60%, 0)`)
          ctx.beginPath()
          ctx.arc(s.x, s.y, s.r * 5, 0, Math.PI * 2)
          ctx.fillStyle = g
          ctx.fill()

          ctx.beginPath()
          ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2)
          ctx.fillStyle = `hsla(${s.hue}, 80%, 95%, ${glow * s.brightness})`
          ctx.fill()

          if (s.r > 2) {
            ctx.save()
            ctx.globalAlpha = glow * 0.5 * s.brightness
            ctx.strokeStyle = `hsla(${s.hue}, 100%, 90%, 1)`
            ctx.lineWidth = 0.6
            const sp = s.r * 4
            ctx.beginPath()
            ctx.moveTo(s.x - sp, s.y); ctx.lineTo(s.x + sp, s.y)
            ctx.moveTo(s.x, s.y - sp); ctx.lineTo(s.x, s.y + sp)
            ctx.stroke()
            ctx.restore()
          }
        })

        animId = requestAnimationFrame(draw)
      }

      draw()

    } else {
      // ── LIGHT MODE: Sky Blue Glow on White ──────────────────

      const glows = Array.from({ length: 7 }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: 150 + Math.random() * 220,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        hue: 195 + Math.random() * 25,
        pulse: Math.random() * Math.PI * 2,
        alpha: 0.08 + Math.random() * 0.08,
      }))

      const particles = Array.from({ length: 80 }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vy: -(0.1 + Math.random() * 0.3),
        r: 0.8 + Math.random() * 2,
        twinkle: Math.random() * Math.PI * 2,
        hue: 195 + Math.random() * 25,
      }))

      const draw = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height)

        glows.forEach(g => {
          g.x += g.vx; g.y += g.vy; g.pulse += 0.006
          if (g.x < -g.r || g.x > canvas.width + g.r)  g.vx *= -1
          if (g.y < -g.r || g.y > canvas.height + g.r) g.vy *= -1
          const pr = g.r + Math.sin(g.pulse) * 25
          const grad = ctx.createRadialGradient(g.x, g.y, 0, g.x, g.y, pr)
          grad.addColorStop(0,   `hsla(${g.hue}, 100%, 60%, ${g.alpha})`)
          grad.addColorStop(0.5, `hsla(${g.hue + 15}, 90%, 55%, ${g.alpha * 0.6})`)
          grad.addColorStop(1,   `hsla(${g.hue + 30}, 80%, 50%, 0)`)
          ctx.beginPath()
          ctx.arc(g.x, g.y, pr, 0, Math.PI * 2)
          ctx.fillStyle = grad
          ctx.fill()
        })

        particles.forEach(p => {
          p.y += p.vy
          p.twinkle += 0.03
          if (p.y < -5) p.y = canvas.height + 5
          const a = 0.3 + 0.4 * Math.abs(Math.sin(p.twinkle))
          ctx.beginPath()
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
          ctx.fillStyle = `hsla(${p.hue}, 80%, 55%, ${a})`
          ctx.fill()
        })

        animId = requestAnimationFrame(draw)
      }

      draw()
    }

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', resize)
    }
  }, [dark])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0, left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    />
  )
}

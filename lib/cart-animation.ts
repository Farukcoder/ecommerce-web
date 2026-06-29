type AnimateAddToCartOptions = {
  imageSrc?: string
  label?: string
  destinationSelector?: string
}

const CART_ANIMATION_DURATION = 720

export function animateAddToCart(
  sourceElement: HTMLElement | null,
  { imageSrc, label, destinationSelector = "[data-cart-target]" }: AnimateAddToCartOptions = {}
) {
  if (!sourceElement || typeof window === "undefined") {
    return
  }

  const destinationElement = document.querySelector<HTMLElement>(destinationSelector)

  if (!destinationElement) {
    return
  }

  const sourceRect = sourceElement.getBoundingClientRect()
  const destinationRect = destinationElement.getBoundingClientRect()
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches

  destinationElement.animate(
    [{ transform: "scale(1)" }, { transform: "scale(1.12)" }, { transform: "scale(1)" }],
    {
      duration: reducedMotion ? 1 : 280,
      easing: "ease-out",
    }
  )

  if (reducedMotion) {
    return
  }

  const flyElement = document.createElement("div")
  const size = Math.max(44, Math.min(sourceRect.width, sourceRect.height, 72))
  const startX = sourceRect.left + sourceRect.width / 2 - size / 2
  const startY = sourceRect.top + sourceRect.height / 2 - size / 2
  const endX = destinationRect.left + destinationRect.width / 2 - size / 2
  const endY = destinationRect.top + destinationRect.height / 2 - size / 2

  flyElement.setAttribute("aria-hidden", "true")
  flyElement.style.position = "fixed"
  flyElement.style.left = `${startX}px`
  flyElement.style.top = `${startY}px`
  flyElement.style.width = `${size}px`
  flyElement.style.height = `${size}px`
  flyElement.style.zIndex = "9999"
  flyElement.style.pointerEvents = "none"
  flyElement.style.borderRadius = "9999px"
  flyElement.style.backgroundColor = "var(--background)"
  flyElement.style.border = "1px solid var(--border)"
  flyElement.style.boxShadow = "0 16px 32px rgba(0, 0, 0, 0.18)"
  flyElement.style.overflow = "hidden"
  flyElement.style.transform = "translate3d(0, 0, 0) scale(1) rotate(0deg)"
  flyElement.style.transition = `transform ${CART_ANIMATION_DURATION}ms cubic-bezier(0.22, 1, 0.36, 1), opacity ${CART_ANIMATION_DURATION}ms ease-out`
  flyElement.style.opacity = "0.98"
  flyElement.style.willChange = "transform, opacity"

  if (imageSrc) {
    flyElement.style.backgroundImage = `url("${imageSrc}")`
    flyElement.style.backgroundSize = "cover"
    flyElement.style.backgroundPosition = "center"
  } else {
    flyElement.style.display = "grid"
    flyElement.style.placeItems = "center"
    flyElement.style.background = "var(--primary)"
    flyElement.style.color = "var(--primary-foreground)"
    flyElement.textContent = "＋"
  }

  if (label) {
    flyElement.title = label
  }

  document.body.appendChild(flyElement)

  requestAnimationFrame(() => {
    const deltaX = endX - startX
    const deltaY = endY - startY
    const travel = Math.max(Math.abs(deltaX), Math.abs(deltaY))
    const arcLift = Math.min(140, Math.max(40, travel * 0.35))

    flyElement.style.transform = `translate3d(${deltaX}px, ${deltaY - arcLift}px, 0) scale(0.2) rotate(18deg)`
    flyElement.style.opacity = "0"
  })

  window.setTimeout(() => {
    flyElement.remove()
  }, CART_ANIMATION_DURATION + 80)
}
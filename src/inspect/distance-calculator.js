export const distanceCalculator = {
  calculate(rect, viewport) {
    const distances = {
      top: rect.top,
      right: viewport.width - rect.right,
      bottom: viewport.height - rect.bottom,
      left: rect.left
    };
    
    const nearbyElements = this.findNearbyElements(rect, viewport);
    
    if (nearbyElements.above) {
      distances.above = rect.top - nearbyElements.above.bottom;
    }
    
    if (nearbyElements.below) {
      distances.below = nearbyElements.below.top - rect.bottom;
    }
    
    if (nearbyElements.left) {
      distances.leftOf = rect.left - nearbyElements.left.right;
    }
    
    if (nearbyElements.right) {
      distances.rightOf = nearbyElements.right.left - rect.right;
    }
    
    return distances;
  },
  
  calculateFromEvent(rect, event) {
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight
    };
    
    return this.calculate(rect, viewport);
  },
  
  findNearbyElements(targetRect, viewport) {
    const elements = document.querySelectorAll('*');
    const nearby = {
      above: null,
      below: null,
      left: null,
      right: null
    };
    
    let minAbove = targetRect.top;
    let minBelow = viewport.height - targetRect.bottom;
    let minLeft = targetRect.left;
    let minRight = viewport.width - targetRect.right;
    
    for (const element of elements) {
      if (element === document.body || element === document.documentElement) continue;
      
      const rect = element.getBoundingClientRect();
      if (rect.width <= 1 || rect.height <= 1) continue;
      
      if (rect.bottom < targetRect.top && targetRect.top - rect.bottom < minAbove) {
        minAbove = targetRect.top - rect.bottom;
        nearby.above = rect;
      }
      
      if (rect.top > targetRect.bottom && rect.top - targetRect.bottom < minBelow) {
        minBelow = rect.top - targetRect.bottom;
        nearby.below = rect;
      }
      
      if (rect.right < targetRect.left && targetRect.left - rect.right < minLeft) {
        minLeft = targetRect.left - rect.right;
        nearby.left = rect;
      }
      
      if (rect.left > targetRect.right && rect.left - targetRect.right < minRight) {
        minRight = rect.left - targetRect.right;
        nearby.right = rect;
      }
    }
    
    return nearby;
  }
};

export default distanceCalculator;
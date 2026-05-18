import * as Network from 'expo-network'

export async function isConnected(): Promise<boolean> {
  try {
    const state = await Network.getNetworkStateAsync()
    return state.isConnected ?? true
  } catch {
    return true
  }
}
